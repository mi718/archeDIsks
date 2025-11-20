import { format, parseISO, isValid, differenceInDays, addDays, startOfDay } from 'date-fns'
import type { TimeUnit } from '@/types'

export const formatDate = (date: string | Date, formatStr: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) {
    throw new Error('Invalid date')
  }
  return format(dateObj, formatStr)
}

export const getDateRange = (start: string, end: string): { start: Date; end: Date } => {
  const startDate = parseISO(start)
  const endDate = parseISO(end)
  
  if (!isValid(startDate) || !isValid(endDate)) {
    throw new Error('Invalid date range')
  }
  
  if (startDate > endDate) {
    throw new Error('Start date must be before end date')
  }
  
  return { start: startDate, end: endDate }
}

export const getDaysInRange = (start: string, end: string): number => {
  const { start: startDate, end: endDate } = getDateRange(start, end)
  return differenceInDays(endDate, startDate) + 1
}

export const snapToTimeUnit = (date: string, timeUnit: TimeUnit): string => {
  const dateObj = parseISO(date)
  if (!isValid(dateObj)) {
    throw new Error('Invalid date')
  }
  
  switch (timeUnit) {
    case 'day':
      return format(startOfDay(dateObj), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
    case 'week':
      // Snap to Monday of the week
      const dayOfWeek = dateObj.getDay()
      const monday = addDays(dateObj, -dayOfWeek + 1)
      return format(startOfDay(monday), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
    case 'month':
      // Snap to first day of month
      const firstOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
      return format(startOfDay(firstOfMonth), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
    case 'quarter':
      // Snap to first day of quarter
      const quarter = Math.floor(dateObj.getMonth() / 3)
      const firstOfQuarter = new Date(dateObj.getFullYear(), quarter * 3, 1)
      return format(startOfDay(firstOfQuarter), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
    default:
      return date
  }
}

export const getTimeUnitTicks = (start: string, end: string, timeUnit: TimeUnit): string[] => {
  const { start: startDate, end: endDate } = getDateRange(start, end)
  const ticks: string[] = []
  
  let current = new Date(startDate)
  
  while (current <= endDate) {
    ticks.push(format(current, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"))
    
    switch (timeUnit) {
      case 'day':
        current = addDays(current, 1)
        break
      case 'week':
        current = addDays(current, 7)
        break
      case 'month':
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
        break
      case 'quarter':
        current = new Date(current.getFullYear(), current.getMonth() + 3, 1)
        break
    }
  }
  
  return ticks
}

export const getTimeUnitLabel = (date: string, timeUnit: TimeUnit): string => {
  const dateObj = parseISO(date)
  if (!isValid(dateObj)) {
    return ''
  }
  
  switch (timeUnit) {
    case 'day':
      return format(dateObj, 'MMM dd')
    case 'week':
      return format(dateObj, 'MMM dd')
    case 'month':
      return format(dateObj, 'MMM yyyy')
    case 'quarter':
      const quarter = Math.floor(dateObj.getMonth() / 3) + 1
      return `Q${quarter} ${dateObj.getFullYear()}`
    default:
      return format(dateObj, 'MMM dd, yyyy')
  }
}

export const isDateInRange = (date: string, start: string, end: string): boolean => {
  const dateObj = parseISO(date)
  const { start: startDate, end: endDate } = getDateRange(start, end)
  
  if (!isValid(dateObj)) {
    return false
  }
  
  return dateObj >= startDate && dateObj <= endDate
}
