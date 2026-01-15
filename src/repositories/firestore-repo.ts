import { BaseDiscRepository } from './base'
import type { Disc } from '@/types'
import { db, auth, sanitizeData } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  // serverTimestamp
} from 'firebase/firestore'

export class FirestoreDiscRepository extends BaseDiscRepository {
  private collectionName = 'discs'

  private get userId(): string | null {
    return auth.currentUser?.uid || null
  }

  async getAll(): Promise<Disc[]> {
    if (!this.userId) return []
    
    try {
      // Query where the user is the owner OR is in the sharedWith array
      // Note: Firestore doesn't support complex OR across different fields easily without multiple queries
      // but we can query by sharedWith (which will include the owner by default in our save logic)
      const q = query(
        collection(db, this.collectionName), 
        where('sharedWith', 'array-contains', this.userId)
      )
      const querySnapshot = await getDocs(q)
      const discs: Disc[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        discs.push(data as Disc)
      })
      return discs
    } catch (error) {
      console.error('Error loading discs from Firestore:', error)
      return []
    }
  }

  async getById(id: string): Promise<Disc | null> {
    if (!this.userId) return null

    try {
      const docRef = doc(db, this.collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as Disc
        // Security check: verify ownership or shared status
        if (data.ownerId === this.userId || data.sharedWith?.includes(this.userId)) {
          return data
        }
      }
      return null
    } catch (error) {
      console.error('Error loading disc by ID from Firestore:', error)
      return null
    }
  }

  async save(disc: Disc): Promise<void> {
    if (!this.userId) {
      throw new Error('User must be authenticated to save to Firestore')
    }

    try {
      this.validateDisc(disc)
      
      const existingDoc = await this.getById(disc.id)
      
      const discToSave: Disc = {
        ...disc,
        ownerId: existingDoc?.ownerId || disc.ownerId || this.userId,
        // Ensure the owner is always in the sharedWith array
        sharedWith: Array.from(new Set([
          ...(existingDoc?.sharedWith || disc.sharedWith || []),
          this.userId
        ])),
        updatedAt: this.getCurrentTimestamp()
      }
      
      await setDoc(doc(db, this.collectionName, disc.id), sanitizeData(discToSave))
    } catch (error) {
      console.error('Error saving disc to Firestore:', error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    if (!this.userId) {
      throw new Error('User must be authenticated to delete from Firestore')
    }

    try {
      // Security check: verify ownership before deleting (optional as rules should handle this)
      const disc = await this.getById(id)
      if (!disc) return

      await deleteDoc(doc(db, this.collectionName, id))
    } catch (error) {
      console.error('Error deleting disc from Firestore:', error)
      throw error
    }
  }

  async export(): Promise<string> {
    try {
      const discs = await this.getAll()
      return JSON.stringify(discs, null, 2)
    } catch (error) {
      console.error('Error exporting discs from Firestore:', error)
      throw error
    }
  }

  async import(jsonData: string): Promise<void> {
    if (!this.userId) {
      throw new Error('User must be authenticated to import to Firestore')
    }

    try {
      const importedDiscs = JSON.parse(jsonData) as Disc[]
      
      if (!Array.isArray(importedDiscs)) {
        throw new Error('Invalid data format: expected array of discs')
      }
      
      for (const disc of importedDiscs) {
        this.validateDisc(disc)
        
        // Ensure the imported disc belongs to the current user and is in the root folder
        const discToSave: Disc = {
          ...disc,
          ownerId: this.userId,
          sharedWith: [this.userId],
          folderId: undefined, // Always import to root folder as requested
          updatedAt: this.getCurrentTimestamp()
        }
        
        await setDoc(doc(db, this.collectionName, disc.id), sanitizeData(discToSave))
      }
    } catch (error) {
      console.error('Error importing discs to Firestore:', error)
      throw error
    }
  }
}
