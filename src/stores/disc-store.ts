import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Disc, DiscState, HistoryState } from '@/types'
import { LocalDiscRepository } from '@/repositories/local-storage'

interface DiscStore extends DiscState, HistoryState {
  // Actions
  loadDiscs: () => Promise<void>
  loadDisc: (id: string) => Promise<void>
  saveDisc: (disc: Disc) => Promise<void>
  deleteDisc: (id: string) => Promise<void>
  createDisc: (disc: Omit<Disc, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => Promise<Disc>
  duplicateDisc: (id: string) => Promise<Disc>
  
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

const repository = new LocalDiscRepository()

export const useDiscStore = create<DiscStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentDisc: undefined,
    discs: [],
    isLoading: false,
    error: undefined,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    // Actions
    loadDiscs: async () => {
      set({ isLoading: true, error: undefined })
      try {
        const discs = await repository.getAll()
        set({ discs, isLoading: false })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load discs',
          isLoading: false 
        })
      }
    },

    loadDisc: async (id: string) => {
      set({ isLoading: true, error: undefined })
      try {
        const disc = await repository.getById(id)
        if (disc) {
          set({ currentDisc: disc, isLoading: false })
          get().pushToHistory(disc)
        } else {
          set({ 
            error: 'Disc not found',
            isLoading: false 
          })
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load disc',
          isLoading: false 
        })
      }
    },

    saveDisc: async (disc: Disc) => {
      set({ isLoading: true, error: undefined })
      try {
        const updatedDisc = {
          ...disc,
          version: disc.version + 1,
          updatedAt: new Date().toISOString()
        }
        
        await repository.save(updatedDisc)
        
        // Update local state
        const { discs } = get()
        const updatedDiscs = discs.map(d => d.id === disc.id ? updatedDisc : d)
        
        set({ 
          currentDisc: updatedDisc,
          discs: updatedDiscs,
          isLoading: false 
        })
        
        get().pushToHistory(updatedDisc)
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to save disc',
          isLoading: false 
        })
      }
    },

    deleteDisc: async (id: string) => {
      set({ isLoading: true, error: undefined })
      try {
        await repository.delete(id)
        
        const { discs, currentDisc } = get()
        const updatedDiscs = discs.filter(d => d.id !== id)
        
        set({ 
          discs: updatedDiscs,
          currentDisc: currentDisc?.id === id ? undefined : currentDisc,
          isLoading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete disc',
          isLoading: false 
        })
      }
    },

    createDisc: async (discData) => {
      set({ isLoading: true, error: undefined })
      try {
        const now = new Date().toISOString()
        const newDisc: Disc = {
          ...discData,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: 1,
          createdAt: now,
          updatedAt: now
        }
        
        await repository.save(newDisc)
        
        const { discs } = get()
        set({ 
          discs: [...discs, newDisc],
          currentDisc: newDisc,
          isLoading: false 
        })
        
        get().pushToHistory(newDisc)
        return newDisc
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create disc',
          isLoading: false 
        })
        throw error
      }
    },

    duplicateDisc: async (id: string) => {
      set({ isLoading: true, error: undefined })
      try {
        const originalDisc = await repository.getById(id)
        if (!originalDisc) {
          throw new Error('Disc not found')
        }
        
        const now = new Date().toISOString()
        const duplicatedDisc: Disc = {
          ...originalDisc,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${originalDisc.name} (Copy)`,
          version: 1,
          createdAt: now,
          updatedAt: now
        }
        
        await repository.save(duplicatedDisc)
        
        const { discs } = get()
        set({ 
          discs: [...discs, duplicatedDisc],
          currentDisc: duplicatedDisc,
          isLoading: false 
        })
        
        get().pushToHistory(duplicatedDisc)
        return duplicatedDisc
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to duplicate disc',
          isLoading: false 
        })
        throw error
      }
    },

    // History actions
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
          canRedo: true
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
          canRedo: newFuture.length > 0
        })
      }
    },

    pushToHistory: (disc: Disc) => {
      const { currentDisc, past } = get()
      if (currentDisc && currentDisc.id !== disc.id) {
        const newPast = [...past, currentDisc].slice(-10) // Keep last 10 states
        set({
          past: newPast,
          future: [],
          canUndo: true,
          canRedo: false
        })
      }
    },

    // Repository actions
    exportDiscs: async () => {
      try {
        return await repository.export()
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to export discs'
        })
        throw error
      }
    },

    importDiscs: async (jsonData: string) => {
      set({ isLoading: true, error: undefined })
      try {
        await repository.import(jsonData)
        const discs = await repository.getAll()
        set({ 
          discs,
          isLoading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to import discs',
          isLoading: false 
        })
        throw error
      }
    },

    // Utility actions
    setError: (error: string | undefined) => {
      set({ error })
    },

    clearError: () => {
      set({ error: undefined })
    }
  }))
)
