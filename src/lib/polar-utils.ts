import { parseISO, isValid } from 'date-fns'
import type { PolarPoint, ArcSegment, TimeUnit } from '@/types'

export const dateToAngle = (date: string, startDate: string, endDate: string): number => {
  const dateObj = parseISO(date)
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  
  if (!isValid(dateObj) || !isValid(start) || !isValid(end)) {
    throw new Error('Invalid date')
  }
  
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const daysFromStart = (dateObj.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  
  // Convert to angle (0 to 2π, starting from top)
  const angle = (daysFromStart / totalDays) * 2 * Math.PI
  
  // Adjust to start from top (12 o'clock position)
  return angle - Math.PI / 2
}

export const angleToDate = (angle: number, startDate: string, endDate: string): string => {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  
  if (!isValid(start) || !isValid(end)) {
    throw new Error('Invalid date range')
  }
  
  // Adjust angle to start from top
  const adjustedAngle = angle + Math.PI / 2
  
  // Normalize angle to 0-2π range
  const normalizedAngle = ((adjustedAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const daysFromStart = (normalizedAngle / (2 * Math.PI)) * totalDays
  
  const resultDate = new Date(start.getTime() + daysFromStart * (1000 * 60 * 60 * 24))
  return resultDate.toISOString()
}

export const polarToCartesian = (angle: number, radius: number): PolarPoint => {
  return {
    angle,
    radius,
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  }
}

export const cartesianToPolar = (x: number, y: number): PolarPoint => {
  const radius = Math.sqrt(x * x + y * y)
  const angle = Math.atan2(y, x)
  return { angle, radius, x, y }
}

export const createArcPath = (arcSegment: ArcSegment): string => {
  const { startAngle, endAngle, innerRadius, outerRadius } = arcSegment
  
  const startInner = polarToCartesian(startAngle, innerRadius)
  const startOuter = polarToCartesian(startAngle, outerRadius)
  const endInner = polarToCartesian(endAngle, innerRadius)
  const endOuter = polarToCartesian(endAngle, outerRadius)
  
  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1'
  
  return [
    `M ${startInner.x} ${startInner.y}`,
    `L ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    'Z'
  ].join(' ')
}

export const createTickPath = (angle: number, innerRadius: number, outerRadius: number): string => {
  const start = polarToCartesian(angle, innerRadius)
  const end = polarToCartesian(angle, outerRadius)
  
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

export const createLabelPath = (angle: number, radius: number): string => {
  const point = polarToCartesian(angle, radius)
  return `M ${point.x} ${point.y}`
}

export const getRingRadii = (ringIndex: number, totalRings: number, centerRadius: number, maxRadius: number): { innerRadius: number; outerRadius: number } => {
  const availableRadius = maxRadius - centerRadius
  const ringHeight = availableRadius / totalRings
  
  const innerRadius = centerRadius + (ringIndex * ringHeight)
  const outerRadius = innerRadius + ringHeight
  
  return { innerRadius, outerRadius }
}

export const snapAngleToTimeUnit = (angle: number, _timeUnit: TimeUnit, _startDate: string, _endDate: string): number => {
  // This would need to be implemented based on the specific snapping logic
  // For now, return the original angle
  return angle
}

export const isPointInArc = (point: { x: number; y: number }, arcSegment: ArcSegment): boolean => {
  const polar = cartesianToPolar(point.x, point.y)
  
  // Check if point is within radius bounds
  if (polar.radius < arcSegment.innerRadius || polar.radius > arcSegment.outerRadius) {
    return false
  }
  
  // Check if point is within angle bounds
  const normalizedAngle = ((polar.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const normalizedStart = ((arcSegment.startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const normalizedEnd = ((arcSegment.endAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  
  if (normalizedStart <= normalizedEnd) {
    return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd
  } else {
    // Handle case where arc crosses 0 radians
    return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd
  }
}

export const getArcCenter = (arcSegment: ArcSegment): { x: number; y: number } => {
  const centerAngle = (arcSegment.startAngle + arcSegment.endAngle) / 2
  const centerRadius = (arcSegment.innerRadius + arcSegment.outerRadius) / 2

  const point = polarToCartesian(centerAngle, centerRadius)
  return { x: point.x, y: point.y }
}

export const getTimeUnitTicks = (start: string, end: string, timeUnit: TimeUnit): string[] => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const ticks: string[] = []

  if (timeUnit === 'week') {
    // Generate weekly ticks
    const current = new Date(startDate)
    while (current <= endDate) {
      ticks.push(current.toISOString())
      current.setDate(current.getDate() + 7)
    }
  } else if (timeUnit === 'month') {
    // Generate monthly ticks
    const current = new Date(startDate)
    while (current <= endDate) {
      ticks.push(current.toISOString())
      current.setMonth(current.getMonth() + 1)
    }
  } else {
    // Default to daily ticks
    const current = new Date(startDate)
    while (current <= endDate) {
      ticks.push(current.toISOString())
      current.setDate(current.getDate() + 1)
    }
  }

  return ticks
}

export const getTimeUnitLabel = (date: string, timeUnit: TimeUnit): string => {
  const d = new Date(date)
  
  if (timeUnit === 'week') {
    return `W${Math.ceil(d.getDate() / 7)}`
  } else if (timeUnit === 'month') {
    return d.toLocaleDateString('en-US', { month: 'short' })
  } else {
    return d.getDate().toString()
  }
}
