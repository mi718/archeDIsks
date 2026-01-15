// disc-store.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Disc, DiscState, HistoryState, Folder } from '@/types'
import { LocalDiscRepository } from '@/repositories/local-storage'
import { FirestoreDiscRepository } from '@/repositories/firestore-repo'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db, auth, sanitizeData } from '@/lib/firebase'
import { useNotificationStore } from './notification-store'
import { nanoid } from 'nanoid'
import { Timestamp } from 'firebase/firestore'

interface DiscStore extends DiscState, HistoryState {
  // Folder state
  folders: Folder[]

  // Actions
  loadDiscs: () => Promise<void>
  loadDisc: (id: string) => Promise<void>
  saveDisc: (disc: Disc) => Promise<void>
  deleteDisc: (id: string) => Promise<void>
  createDisc: (disc: Omit<Disc, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => Promise<Disc>
  duplicateDisc: (id: string) => Promise<Disc>
  moveDiscToFolder: (discId: string, folderId: string | null) => Promise<void>

  // Folder actions
  createFolder: (name: string) => Promise<Folder>
  deleteFolder: (folderId: string) => Promise<void>
  shareFolder: (folderId: string, expirationHours: number) => Promise<string | null>
  joinFolder: (shareCode: string) => Promise<Folder>
  leaveFolder: (folderId: string) => Promise<void>
  getFolderAccessCount: (folderId: string) => Promise<number>

  // Sync
  syncLocalToFirestore: () => Promise<void>

  // History actions
  undo: () => void
  redo: () => void
  pushToHistory: (disc: Disc) => void

  // Repository actions
  exportDiscs: () => Promise<string>
  importDiscs: (jsonData: string) => Promise<void>

  // Utility actions
  setError: (error: string | undefined) => void
  clearError: () => void
}

const localRepository = new LocalDiscRepository()
const firestoreRepository = new FirestoreDiscRepository()

const getRepository = () => (auth.currentUser ? firestoreRepository : localRepository)

const FOLDERS_STORAGE_KEY = 'archedisks_folders'
const SHARED_CODES_COLLECTION = 'sharedFolderCodes'
const FOLDERS_COLLECTION = 'folders'
const DISCS_COLLECTION = 'discs'

const loadFolders = (): any[] => {
  try {
    const stored = localStorage.getItem(FOLDERS_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading folders:', error)
    return []
  }
}

const saveFolders = (folders: any) => {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders))
  } catch (error) {
    console.error('Error saving folders:', error)
  }
}

const syncFoldersToFirestore = async () => {
  if (!auth.currentUser) return

  try {
    const localFolders = loadFolders()
    if (localFolders.length === 0) return

    console.log(`[DEBUG_LOG] Syncing ${localFolders.length} local folders to Firestore...`)
    const userId = auth.currentUser.uid

    for (const folder of localFolders) {
      await setDoc(
        doc(db, FOLDERS_COLLECTION, folder.id),
        sanitizeData({
          ...folder,
          ownerId: userId,
          sharedWith: [userId],
        })
      )
    }

    console.log(`[DEBUG_LOG] Folders sync complete.`)
  } catch (error) {
    console.error('Error syncing folders to Firestore:', error)
  }
}

// --- Keep Firestore listeners clean across repeated loadDiscs calls ---
let foldersUnsub: Unsubscribe | null = null
let discsUnsubs: Unsubscribe[] = []

const stopFirestoreListeners = () => {
  if (foldersUnsub) {
    foldersUnsub()
    foldersUnsub = null
  }
  if (discsUnsubs.length) {
    discsUnsubs.forEach((u) => u())
    discsUnsubs = []
  }
}

// Firestore "in" supports max 10 elements
const chunk = <T,>(arr: T[], size: number) => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export const useDiscStore = create<DiscStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentDisc: undefined,
    discs: [],
    folders: [],
    isLoading: false,
    error: undefined,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    // ---------------------------
    // Load all discs + folders
    // ---------------------------
    loadDiscs: async () => {
      set({ isLoading: true, error: undefined })

      try {
        // Always stop previous listeners before starting new ones
        stopFirestoreListeners()

        // Local mode (not authenticated)
        if (!auth.currentUser) {
          set({
            discs: await localRepository.getAll(),
            folders: loadFolders(),
            isLoading: false,
          })
          return
        }

        const userUid = auth.currentUser.uid

        // Listen to folders accessible by user
        const foldersQuery = query(
          collection(db, FOLDERS_COLLECTION),
          where('sharedWith', 'array-contains', userUid)
        )

        foldersUnsub = onSnapshot(
          foldersQuery,
          (foldersSnap) => {
            const folders = foldersSnap.docs.map((f) => ({
              id: f.id,
              ...(f.data() as any),
            })) as Folder[]

            set({ folders })

            // Clear previous disc listeners when folders list changes
            discsUnsubs.forEach((u) => u())
            discsUnsubs = []

            const folderIds = folders.map((f) => f.id)
            if (folderIds.length === 0) {
              set({ discs: [], isLoading: false })
              return
            }

            // We will merge results from multiple queries if > 10 folderIds
            const byId = new Map<string, Disc>()

            const folderIdChunks = chunk(folderIds, 10)
            folderIdChunks.forEach((ids) => {
              const discsQuery = query(collection(db, DISCS_COLLECTION), where('folderId', 'in', ids))

              const unsub = onSnapshot(
                discsQuery,
                (discsSnap) => {
                  // Update merged map with this chunk’s docs
                  discsSnap.docs.forEach((d) => {
                    byId.set(d.id, { id: d.id, ...(d.data() as any) } as Disc)
                  })

                  // Also remove docs that disappeared from this chunk snapshot:
                  // We can approximate by rebuilding this chunk’s ids; but Firestore doesn't
                  // tell removed docs unless we inspect docChanges.
                  // Let's do it properly with docChanges:
                  discsSnap.docChanges().forEach((ch) => {
                    if (ch.type === 'removed') {
                      byId.delete(ch.doc.id)
                    }
                  })

                  set({
                    discs: Array.from(byId.values()),
                    isLoading: false,
                  })
                },
                (err) => {
                  set({
                    error: err?.message ?? 'Failed to load discs (listener)',
                    isLoading: false,
                  })
                }
              )

              discsUnsubs.push(unsub)
            })
          },
          (err) => {
            set({
              error: err?.message ?? 'Failed to load folders (listener)',
              isLoading: false,
            })
          }
        )
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load discs',
          isLoading: false,
        })
      }
    },

    // ---------------------------
    // Load single disc
    // ---------------------------
    loadDisc: async (id: string) => {
      set({ isLoading: true, error: undefined })
      try {
        const disc = await getRepository().getById(id)
        if (disc) {
          set({ currentDisc: disc, isLoading: false })
          get().pushToHistory(disc)
        } else {
          set({ error: 'Disc not found', isLoading: false })
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to load disc', isLoading: false })
      }
    },

    // ---------------------------
    // Save disc
    // ---------------------------
    saveDisc: async (disc: Disc) => {
      set({ isLoading: true, error: undefined })
      const { success, error: showError } = useNotificationStore.getState()

      try {
        const updatedDisc: Disc = {
          ...disc,
          version: disc.version + 1,
          updatedAt: new Date().toISOString(),
        }

        await getRepository().save(updatedDisc)

        const { discs } = get()
        const updatedDiscs = discs.map((d) => (d.id === disc.id ? updatedDisc : d))

        set({
          currentDisc: updatedDisc,
          discs: updatedDiscs,
          isLoading: false,
        })

        get().pushToHistory(updatedDisc)
        success('Disc saved successfully')
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to save disc'
        set({ error: errorMsg, isLoading: false })
        showError(errorMsg)
      }
    },

    // ---------------------------
    // Delete disc
    // ---------------------------
    deleteDisc: async (id: string) => {
      set({ isLoading: true, error: undefined })
      try {
        await getRepository().delete(id)

        const { discs, currentDisc } = get()
        const updatedDiscs = discs.filter((d) => d.id !== id)

        set({
          discs: updatedDiscs,
          currentDisc: currentDisc?.id === id ? undefined : currentDisc,
          isLoading: false,
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to delete disc', isLoading: false })
      }
    },

    // ---------------------------
    // Create disc
    // ---------------------------
    createDisc: async (discData) => {
      set({ isLoading: true, error: undefined })
      try {
        const now = new Date().toISOString()

        const newDisc: Disc = {
          ...discData,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: 1,
          createdAt: now,
          updatedAt: now,
        }

        await getRepository().save(newDisc)

        const { discs } = get()
        set({ discs: [...discs, newDisc], currentDisc: newDisc, isLoading: false })
        get().pushToHistory(newDisc)

        return newDisc
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to create disc', isLoading: false })
        throw error
      }
    },

    // ---------------------------
    // Duplicate disc
    // ---------------------------
    duplicateDisc: async (id: string) => {
      set({ isLoading: true, error: undefined })
      try {
        const originalDisc = await getRepository().getById(id)
        if (!originalDisc) throw new Error('Disc not found')

        const now = new Date().toISOString()

        const duplicatedDisc: Disc = {
          ...originalDisc,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${originalDisc.name} (Copy)`,
          version: 1,
          createdAt: now,
          updatedAt: now,
        }

        await getRepository().save(duplicatedDisc)

        const { discs } = get()
        set({ discs: [...discs, duplicatedDisc], currentDisc: duplicatedDisc, isLoading: false })
        get().pushToHistory(duplicatedDisc)

        return duplicatedDisc
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to duplicate disc', isLoading: false })
        throw error
      }
    },

    // ---------------------------
    // Move disc to folder
    // ---------------------------
    moveDiscToFolder: async (discId: string, folderId: string | null) => {
      const { discs } = get()
      const disc = discs.find((d) => d.id === discId)
      if (!disc) return

      const updatedDisc: Disc = {
        ...disc,
        folderId: folderId || undefined,
        updatedAt: new Date().toISOString(),
      }

      await getRepository().save(updatedDisc)

      const updatedDiscs = discs.map((d) => (d.id === discId ? updatedDisc : d))
      set({ discs: updatedDiscs })

      if (get().currentDisc?.id === discId) {
        set({ currentDisc: updatedDisc })
      }
    },

    // ---------------------------
    // Sync local -> Firestore
    // ---------------------------
    syncLocalToFirestore: async () => {
      if (!auth.currentUser) return

      try {
        await syncFoldersToFirestore()

        const localDiscs = await localRepository.getAll()
        if (localDiscs.length > 0) {
          console.log(`[DEBUG_LOG] Syncing ${localDiscs.length} local discs to Firestore...`)
          for (const disc of localDiscs) {
            await firestoreRepository.save(disc)
          }
        }

        await get().loadDiscs()
        console.log(`[DEBUG_LOG] Full sync complete.`)
      } catch (error) {
        console.error('Error syncing to Firestore:', error)
      }
    },

    // ---------------------------
    // Share folder
    // ---------------------------
    shareFolder: async (folderId: string, expirationHours: number) => {
      if (!auth.currentUser) throw new Error('Not authenticated')

      const ownerUid = auth.currentUser.uid
      const code = nanoid(8)
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + expirationHours * 60 * 60 * 1000))

      const codeDoc = {
        code,
        folderId,
        ownerUid,
        expiresAt,
        usedBy: [] as string[],
      }

      await setDoc(doc(db, SHARED_CODES_COLLECTION, code), codeDoc)
      return code
    },

    // ---------------------------
    // Join folder via share code
    // ---------------------------
    joinFolder: async (shareCode: string) => {
      if (!auth.currentUser) throw new Error('Not authenticated')

      const userUid = auth.currentUser.uid
      const codeRef = doc(db, SHARED_CODES_COLLECTION, shareCode)
      const codeSnap = await getDoc(codeRef)

      if (!codeSnap.exists()) throw new Error('Invalid or expired code')

      const codeData = codeSnap.data() as any

      if (codeData.ownerUid === userUid) throw new Error('You cannot join your own shared folder')

      if (codeData.expiresAt?.toDate?.() && codeData.expiresAt.toDate() < new Date()) {
        await deleteDoc(codeRef)
        throw new Error('This code has expired')
      }

      if (Array.isArray(codeData.usedBy) && codeData.usedBy.includes(userUid)) {
        throw new Error('You have already joined this folder')
      }

      const folderRef = doc(db, FOLDERS_COLLECTION, codeData.folderId)

      // Add user to folder
      await setDoc(folderRef, { sharedWith: arrayUnion(userUid) }, { merge: true })

      // Mark code used by user
      await setDoc(codeRef, { usedBy: arrayUnion(userUid) }, { merge: true })

      // Add user to all discs in this folder
      const discsQuery = query(collection(db, DISCS_COLLECTION), where('folderId', '==', codeData.folderId))
      const discsSnap = await getDocs(discsQuery)

      const updates: Promise<unknown>[] = []
      discsSnap.forEach((d) => {
        updates.push(setDoc(d.ref, { sharedWith: arrayUnion(userUid) }, { merge: true }))
      })
      await Promise.all(updates)

      const folderSnap = await getDoc(folderRef)
      if (!folderSnap.exists()) throw new Error('Folder not found')

      return { id: folderSnap.id, ...(folderSnap.data() as any) } as Folder
    },

    // ---------------------------
    // Leave folder (FIXED)
    // ---------------------------
    leaveFolder: async (folderId: string) => {
      if (!auth.currentUser) throw new Error('Not authenticated')

      const userUid = auth.currentUser.uid
      const folderRef = doc(db, FOLDERS_COLLECTION, folderId)

      // Remove user from folder's sharedWith
      await setDoc(folderRef, { sharedWith: arrayRemove(userUid) }, { merge: true })

      // Remove user from all discs in this folder
      const discsQuery = query(collection(db, DISCS_COLLECTION), where('folderId', '==', folderId))
      const discsSnap = await getDocs(discsQuery)

      const updates: Promise<unknown>[] = []
      discsSnap.forEach((d) => {
        updates.push(setDoc(d.ref, { sharedWith: arrayRemove(userUid) }, { merge: true }))
      })

      await Promise.all(updates)
    },

    // ---------------------------
    // Get folder access count
    // ---------------------------
    getFolderAccessCount: async (folderId: string) => {
      const folderSnap = await getDoc(doc(db, FOLDERS_COLLECTION, folderId))
      if (!folderSnap.exists()) return 0

      const folderData = folderSnap.data() as any
      return Array.isArray(folderData.sharedWith) ? folderData.sharedWith.length : 1
    },

    // ---------------------------
    // History actions
    // ---------------------------
    undo: () => {
      const { past, currentDisc } = get()
      if (past.length > 0 && currentDisc) {
        const previousDisc = past[past.length - 1]
        const newPast = past.slice(0, -1)
        const newFuture = [currentDisc, ...get().future]

        set({
          currentDisc: previousDisc,
          past: newPast,
          future: newFuture,
          canUndo: newPast.length > 0,
          canRedo: true,
        })
      }
    },

    redo: () => {
      const { future, currentDisc } = get()
      if (future.length > 0 && currentDisc) {
        const nextDisc = future[0]
        const newFuture = future.slice(1)
        const newPast = [...get().past, currentDisc]

        set({
          currentDisc: nextDisc,
          past: newPast,
          future: newFuture,
          canUndo: true,
          canRedo: newFuture.length > 0,
        })
      }
    },

    pushToHistory: (disc: Disc) => {
      const { currentDisc, past } = get()
      if (currentDisc && currentDisc.id !== disc.id) {
        const newPast = [...past, currentDisc].slice(-10)
        set({
          past: newPast,
          future: [],
          canUndo: true,
          canRedo: false,
        })
      }
    },

    // ---------------------------
    // Repository actions
    // ---------------------------
    exportDiscs: async () => {
      try {
        return await getRepository().export()
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to export discs' })
        throw error
      }
    },

    importDiscs: async (jsonData: string) => {
      set({ isLoading: true, error: undefined })
      const { success, error: showError } = useNotificationStore.getState()
      try {
        const importedDiscs = JSON.parse(jsonData)
        if (!Array.isArray(importedDiscs)) throw new Error('Invalid data format: expected array of discs')
        // Clean imported discs: set folderId to undefined
        for (const disc of importedDiscs) {
          disc.folderId = undefined
        }
        // Get existing discs
        const existingDiscs = await getRepository().getAll()
        const existingIds = new Set(existingDiscs.map(d => d.id))
        // Add imported discs that don't already exist
        const newDiscs = importedDiscs.filter(disc => !existingIds.has(disc.id))
        // Merge: keep all existing discs, add new imported discs to root
        const mergedDiscs = [...existingDiscs, ...newDiscs]
        // Save merged discs
        if (auth.currentUser) {
          // Firestore: save each new disc
          for (const disc of newDiscs) {
            await getRepository().save(disc)
          }
        } else {
          // Local: overwrite storage
          localStorage.setItem('archedisks_discs', JSON.stringify(mergedDiscs))
        }
        set({ discs: mergedDiscs, isLoading: false })
        success('Discs imported successfully')
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to import discs'
        set({ error: errorMsg, isLoading: false })
        showError(errorMsg)
        throw error
      }
    },

    // ---------------------------
    // Utility actions
    // ---------------------------
    setError: (error: string | undefined) => set({ error }),
    clearError: () => set({ error: undefined }),

    // ---------------------------
    // Folder actions
    // ---------------------------
    createFolder: async (name: string) => {
      const now = new Date().toISOString()
      // Replace with actual user id if available
      const ownerId = (typeof auth !== 'undefined' && auth?.currentUser?.uid) ? auth.currentUser.uid : 'unknown'
      const newFolder: Folder = {
        id: `folder_${Date.now()}`,
        name,
        createdAt: now,
        updatedAt: now,
        ownerId,
        sharedWith: [],
      }

      const { folders } = get()
      const updatedFolders = [...folders, newFolder]

      if (auth.currentUser) {
        await setDoc(
          doc(db, FOLDERS_COLLECTION, newFolder.id),
          sanitizeData({
            ...newFolder,
            ownerId: auth.currentUser.uid,
            sharedWith: [auth.currentUser.uid],
          })
        )
      } else {
        saveFolders(updatedFolders)
      }

      set({ folders: updatedFolders })
      return newFolder
    },

    deleteFolder: async (folderId: string) => {
      const { folders, discs } = get()

      // Move all discs in this folder to root
      const updatedDiscs = discs.map((disc) =>
        disc.folderId === folderId
          ? { ...disc, folderId: undefined, updatedAt: new Date().toISOString() }
          : disc
      )

      const updatedFolders = folders.filter((f) => f.id !== folderId)

      if (auth.currentUser) {
        await deleteDoc(doc(db, FOLDERS_COLLECTION, folderId))
      } else {
        saveFolders(updatedFolders)
      }

      set({
        folders: updatedFolders,
        discs: updatedDiscs,
      })

      // Save only discs that changed folder
      const changed = updatedDiscs.filter((d) => discs.find((orig) => orig.id === d.id)?.folderId !== d.folderId)
      for (const disc of changed) {
        await getRepository().save(disc)
      }
    },
  }))
)