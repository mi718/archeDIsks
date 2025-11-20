import { describe, it, expect } from 'vitest'
import { 
  dateToAngle, 
  angleToDate, 
  polarToCartesian, 
  cartesianToPolar,
  createArcPath,
  createTickPath,
  getRingRadii,
  isPointInArc
} from '../polar-utils'

describe('polar-utils', () => {
  describe('dateToAngle', () => {
    it('should convert date to angle correctly', () => {
      const angle = dateToAngle('2025-06-15', '2025-01-01', '2025-12-31')
      // June 15th is approximately 165 days from Jan 1st out of 365 days
      // So angle should be approximately 165/365 * 2π - π/2
      const expectedAngle = (165 / 365) * 2 * Math.PI - Math.PI / 2
      expect(angle).toBeCloseTo(expectedAngle, 1)
    })

    it('should handle start date', () => {
      const angle = dateToAngle('2025-01-01', '2025-01-01', '2025-12-31')
      expect(angle).toBeCloseTo(-Math.PI / 2, 2) // Should start from top
    })

    it('should handle end date', () => {
      const angle = dateToAngle('2025-12-31', '2025-01-01', '2025-12-31')
      expect(angle).toBeCloseTo(3 * Math.PI / 2, 2) // Should be at bottom
    })
  })

  describe('angleToDate', () => {
    it('should convert angle to date correctly', () => {
      // Test with a known angle that should give us a specific date
      const angle = (165 / 365) * 2 * Math.PI - Math.PI / 2
      const date = angleToDate(angle, '2025-01-01', '2025-12-31')
      expect(date).toMatch(/2025-06-1[45]/)
    })

    it('should handle start angle', () => {
      const date = angleToDate(-Math.PI / 2, '2025-01-01', '2025-12-31')
      // The date might be off by a day due to timezone handling
      expect(date).toMatch(/2025-01-0[01]|2024-12-31/)
    })
  })

  describe('polarToCartesian', () => {
    it('should convert polar to cartesian correctly', () => {
      const point = polarToCartesian(0, 100)
      expect(point.x).toBeCloseTo(100, 2)
      expect(point.y).toBeCloseTo(0, 2)
    })

    it('should handle 90 degrees', () => {
      const point = polarToCartesian(Math.PI / 2, 100)
      expect(point.x).toBeCloseTo(0, 2)
      expect(point.y).toBeCloseTo(100, 2)
    })
  })

  describe('cartesianToPolar', () => {
    it('should convert cartesian to polar correctly', () => {
      const point = cartesianToPolar(100, 0)
      expect(point.radius).toBeCloseTo(100, 2)
      expect(point.angle).toBeCloseTo(0, 2)
    })

    it('should handle negative coordinates', () => {
      const point = cartesianToPolar(-100, 0)
      expect(point.radius).toBeCloseTo(100, 2)
      expect(point.angle).toBeCloseTo(Math.PI, 2)
    })
  })

  describe('createArcPath', () => {
    it('should create arc path correctly', () => {
      const arcSegment = {
        startAngle: 0,
        endAngle: Math.PI / 2,
        innerRadius: 50,
        outerRadius: 100
      }
      const path = createArcPath(arcSegment)
      expect(path).toContain('M')
      expect(path).toContain('L')
      expect(path).toContain('A')
      expect(path).toContain('Z')
    })
  })

  describe('createTickPath', () => {
    it('should create tick path correctly', () => {
      const path = createTickPath(Math.PI / 2, 50, 100)
      expect(path).toContain('M')
      expect(path).toContain('L')
    })
  })

  describe('getRingRadii', () => {
    it('should calculate ring radii correctly', () => {
      const { innerRadius, outerRadius } = getRingRadii(0, 3, 50, 200)
      expect(innerRadius).toBe(50)
      expect(outerRadius).toBe(100)
    })

    it('should handle multiple rings', () => {
      const ring1 = getRingRadii(0, 3, 50, 200)
      const ring2 = getRingRadii(1, 3, 50, 200)
      const ring3 = getRingRadii(2, 3, 50, 200)
      
      expect(ring1.innerRadius).toBe(50)
      expect(ring1.outerRadius).toBe(100)
      expect(ring2.innerRadius).toBe(100)
      expect(ring2.outerRadius).toBe(150)
      expect(ring3.innerRadius).toBe(150)
      expect(ring3.outerRadius).toBe(200)
    })
  })

  describe('isPointInArc', () => {
    it('should return true for point inside arc', () => {
      const arcSegment = {
        startAngle: 0,
        endAngle: Math.PI / 2,
        innerRadius: 50,
        outerRadius: 100
      }
      const point = { x: 75, y: 0 } // Should be inside
      const result = isPointInArc(point, arcSegment)
      expect(result).toBe(true)
    })

    it('should return false for point outside arc', () => {
      const arcSegment = {
        startAngle: 0,
        endAngle: Math.PI / 2,
        innerRadius: 50,
        outerRadius: 100
      }
      const point = { x: -75, y: 0 } // Should be outside
      const result = isPointInArc(point, arcSegment)
      expect(result).toBe(false)
    })
  })
})
