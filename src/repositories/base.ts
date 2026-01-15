import type { Disc, DiscRepository } from '@/types'

export abstract class BaseDiscRepository implements DiscRepository {
  abstract getAll(): Promise<Disc[]>
  abstract getById(id: string): Promise<Disc | null>
  abstract save(disc: Disc): Promise<void>
  abstract delete(id: string): Promise<void>
  abstract export(): Promise<string>
  abstract import(jsonData: string): Promise<void>

  protected validateDisc(disc: Disc): void {
    if (!disc.id || !disc.name || !disc.start || !disc.end) {
      throw new Error('Invalid disc: missing required fields')
    }
    
    if (new Date(disc.start) >= new Date(disc.end)) {
      throw new Error('Invalid disc: start date must be before end date')
    }
    
    if (disc.version < 1) {
      throw new Error('Invalid disc: version must be at least 1')
    }
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString()
  }
}
