import { BaseDiscRepository } from './base'
import type { Disc } from '@/types'

const STORAGE_KEY = 'archedisks_discs'

export class LocalDiscRepository extends BaseDiscRepository {
  async getAll(): Promise<Disc[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return []
      }
      
      const discs = JSON.parse(stored) as Disc[]
      return Array.isArray(discs) ? discs : []
    } catch (error) {
      console.error('Error loading discs from localStorage:', error)
      return []
    }
  }

  async getById(id: string): Promise<Disc | null> {
    try {
      const discs = await this.getAll()
      return discs.find(disc => disc.id === id) || null
    } catch (error) {
      console.error('Error loading disc by ID:', error)
      return null
    }
  }

  async save(disc: Disc): Promise<void> {
    try {
      this.validateDisc(disc)
      
      const discs = await this.getAll()
      const existingIndex = discs.findIndex(d => d.id === disc.id)
      
      if (existingIndex >= 0) {
        discs[existingIndex] = { ...disc, updatedAt: this.getCurrentTimestamp() }
      } else {
        discs.push(disc)
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(discs))
    } catch (error) {
      console.error('Error saving disc:', error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const discs = await this.getAll()
      const filteredDiscs = discs.filter(disc => disc.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDiscs))
    } catch (error) {
      console.error('Error deleting disc:', error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing storage:', error)
      throw error
    }
  }

  async export(): Promise<string> {
    try {
      const discs = await this.getAll()
      return JSON.stringify(discs, null, 2)
    } catch (error) {
      console.error('Error exporting discs:', error)
      throw error
    }
  }

  async import(jsonData: string): Promise<void> {
    try {
      const importedDiscs = JSON.parse(jsonData) as Disc[]
      
      if (!Array.isArray(importedDiscs)) {
        throw new Error('Invalid data format: expected array of discs')
      }
      
      // Validate all discs before importing
      for (const disc of importedDiscs) {
        this.validateDisc(disc)
      }
      
      // Get existing discs and merge with imported ones
      const existingDiscs = await this.getAll()
      const existingIds = new Set(existingDiscs.map(d => d.id))
      
      // Add imported discs that don't already exist
      const newDiscs = importedDiscs.filter(disc => !existingIds.has(disc.id))
      const mergedDiscs = [...existingDiscs, ...newDiscs]
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedDiscs))
    } catch (error) {
      console.error('Error importing discs:', error)
      throw error
    }
  }
}
