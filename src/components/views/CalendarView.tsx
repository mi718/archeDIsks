import { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import type { Disc, Activity } from '@/types'
import { useUIStore } from '@/stores/ui-store'

interface CalendarViewProps {
  disc: Disc
}

export const CalendarView = ({ disc }: CalendarViewProps) => {
  const { filters, openActivityDrawer } = useUIStore()
  const [currentMonth, setCurrentMonth] = useState(() => new Date(disc.start))

  // Update currentMonth if disc.start changes
  useMemo(() => {
    setCurrentMonth(new Date(disc.start));
  }, [disc.start]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1))
  }

  const filteredActivities = useMemo(() => {
    // Get all activities from all rings
    const allActivities = disc.rings.flatMap(ring => ring.activities || [])

    // Apply filters
    return allActivities.filter(activity => {
      // Ring filter
      if (filters.ringIds.length > 0 && !filters.ringIds.includes(activity.ringId)) {
        return false
      }

      // Label filter
      if (filters.labelIds.length > 0 && activity.labelIds) {
        const hasMatchingLabel = activity.labelIds.some(labelId => 
          filters.labelIds.includes(labelId)
        )
        if (!hasMatchingLabel) return false
      }

      // Text search
      if (filters.textSearch) {
        const searchText = filters.textSearch.toLowerCase()
        const matchesTitle = activity.title.toLowerCase().includes(searchText)
        const matchesDescription = activity.description?.toLowerCase().includes(searchText) || false
        if (!matchesTitle && !matchesDescription) return false
      }

      // Date range filter
      if (filters.dateRange) {
        const activityStart = new Date(activity.start)
        const activityEnd = activity.end ? new Date(activity.end) : activityStart
        const filterStart = new Date(filters.dateRange.start)
        const filterEnd = new Date(filters.dateRange.end)

        if (activityEnd < filterStart || activityStart > filterEnd) {
          return false
        }
      }

      return true
    })
  }, [disc, filters])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    // Add empty cells for days before the month starts
    const startDay = start.getDay()
    const emptyDays = Array.from({ length: startDay }, () => null)

    return [...emptyDays, ...days]
  }, [currentMonth])

  const getActivitiesForDay = (day: Date) => {
    return filteredActivities.filter(activity => {
      const activityStart = new Date(activity.start)
      const activityEnd = activity.end ? new Date(activity.end) : activityStart

      return isSameDay(activityStart, day) || 
             isSameDay(activityEnd, day) ||
             (activityStart <= day && activityEnd >= day)
    })
  }

  const getRingForActivity = (activity: Activity) => {
    return disc.rings.find(ring => ring.id === activity.ringId)
  }


  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            onClick={handlePreviousMonth}
          >
            ←
          </button>
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            onClick={handleNextMonth}
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-24 border border-gray-200 dark:border-gray-700" />
            }

            const dayActivities = getActivitiesForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                className={`
                  h-32 border border-gray-200 dark:border-gray-700 p-1 overflow-hidden
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                  ${isToday ? 'ring-2 ring-primary-500' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
                    ${isToday ? 'text-primary-600 dark:text-primary-400' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-1">
                  {dayActivities.slice(0, 3).map(activity => {
                    const ring = getRingForActivity(activity)

                    return (
                      <div
                        key={activity.id}
                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ 
                          backgroundColor: activity.color || ring?.color || '#3b82f6',
                          color: 'white'
                        }}
                        title={`${activity.title} - ${ring?.name}`}
                        onClick={() => openActivityDrawer(String(activity.id))}
                      >
                        {activity.title}
                      </div>
                    )
                  })}
                  {dayActivities.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayActivities.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
