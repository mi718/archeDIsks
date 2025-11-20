import { describe, it, expect } from 'vitest'
import { 
  formatDate, 
  getDateRange, 
  getDaysInRange, 
  snapToTimeUnit, 
  getTimeUnitTicks,
  getTimeUnitLabel,
  isDateInRange
} from '../date-utils'

describe('date-utils', () => {
  describe('formatDate', () => {
    it('should format a date string correctly', () => {
      const result = formatDate('2025-01-15T10:30:00.000Z', 'yyyy-MM-dd')
      expect(result).toBe('2025-01-15')
    })

    it('should format a Date object correctly', () => {
      const date = new Date('2025-01-15T10:30:00.000Z')
      const result = formatDate(date, 'MMM dd, yyyy')
      expect(result).toBe('Jan 15, 2025')
    })

    it('should throw error for invalid date', () => {
      expect(() => formatDate('invalid-date')).toThrow('Invalid date')
    })
  })

  describe('getDateRange', () => {
    it('should return valid date range', () => {
      const result = getDateRange('2025-01-01', '2025-12-31')
      expect(result.start).toBeInstanceOf(Date)
      expect(result.end).toBeInstanceOf(Date)
      expect(result.start.getTime()).toBeLessThan(result.end.getTime())
    })

    it('should throw error for invalid dates', () => {
      expect(() => getDateRange('invalid', '2025-12-31')).toThrow('Invalid date range')
    })

    it('should throw error when start is after end', () => {
      expect(() => getDateRange('2025-12-31', '2025-01-01')).toThrow('Start date must be before end date')
    })
  })

  describe('getDaysInRange', () => {
    it('should calculate days correctly', () => {
      const result = getDaysInRange('2025-01-01', '2025-01-31')
      expect(result).toBe(31)
    })

    it('should handle single day', () => {
      const result = getDaysInRange('2025-01-01', '2025-01-01')
      expect(result).toBe(1)
    })
  })

  describe('snapToTimeUnit', () => {
    it('should snap to day correctly', () => {
      const result = snapToTimeUnit('2025-01-15T14:30:00.000Z', 'day')
      expect(result).toMatch(/2025-01-15T00:00:00/)
    })

    it('should snap to month correctly', () => {
      const result = snapToTimeUnit('2025-01-15T14:30:00.000Z', 'month')
      expect(result).toMatch(/2025-01-01T00:00:00/)
    })
  })

  describe('getTimeUnitTicks', () => {
    it('should generate monthly ticks', () => {
      const ticks = getTimeUnitTicks('2025-01-01', '2025-03-31', 'month')
      expect(ticks).toHaveLength(3)
      expect(ticks[0]).toMatch(/2025-01-01/)
      expect(ticks[1]).toMatch(/2025-02-01/)
      expect(ticks[2]).toMatch(/2025-03-01/)
    })

    it('should generate daily ticks', () => {
      const ticks = getTimeUnitTicks('2025-01-01', '2025-01-03', 'day')
      expect(ticks).toHaveLength(3)
    })
  })

  describe('getTimeUnitLabel', () => {
    it('should format month label correctly', () => {
      const result = getTimeUnitLabel('2025-01-15T10:30:00.000Z', 'month')
      expect(result).toBe('Jan 2025')
    })

    it('should format day label correctly', () => {
      const result = getTimeUnitLabel('2025-01-15T10:30:00.000Z', 'day')
      expect(result).toBe('Jan 15')
    })
  })

  describe('isDateInRange', () => {
    it('should return true for date within range', () => {
      const result = isDateInRange('2025-06-15', '2025-01-01', '2025-12-31')
      expect(result).toBe(true)
    })

    it('should return false for date outside range', () => {
      const result = isDateInRange('2024-12-31', '2025-01-01', '2025-12-31')
      expect(result).toBe(false)
    })

    it('should return false for invalid date', () => {
      const result = isDateInRange('invalid-date', '2025-01-01', '2025-12-31')
      expect(result).toBe(false)
    })
  })
})
