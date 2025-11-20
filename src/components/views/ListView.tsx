import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronUp, Calendar, Tag, Edit } from 'lucide-react'
import type { Disc, Activity } from '@/types'
import { useUIStore } from '@/stores/ui-store'

interface ListViewProps {
  disc: Disc
}

export const ListView = ({ disc }: ListViewProps) => {
  const { filters, openActivityDrawer } = useUIStore()
  const [sortBy, setSortBy] = useState<'title' | 'start' | 'end' | 'ring'>('start')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  const { sortedActivities } = useMemo(() => {
    // Get all activities from all rings
    const allActivities = disc.rings.flatMap(ring => 
      (ring.activities || []).map(activity => ({
        ...activity,
        ringName: ring.name,
        ringColor: ring.color
      }))
    )

    // Apply filters
    const filtered = allActivities.filter(activity => {
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

    // Sort activities
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      // Pre-calculate end dates to avoid lexical declarations in case blocks
      const aEnd = a.end ? new Date(a.end).getTime() : new Date(a.start).getTime()
      const bEnd = b.end ? new Date(b.end).getTime() : new Date(b.start).getTime()

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'start':
          comparison = new Date(a.start).getTime() - new Date(b.start).getTime()
          break
        case 'end':
          comparison = aEnd - bEnd
          break
        case 'ring':
          comparison = a.ringName.localeCompare(b.ringName)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return {
      sortedActivities: sorted
    }
  }, [disc, filters, sortBy, sortOrder])

  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  const getLabelsForActivity = (activity: Activity) => {
    if (!activity.labelIds) return []
    return disc.labels.filter(label => activity.labelIds?.includes(label.id))
  }

  type SortField = 'title' | 'start' | 'end' | 'ring';

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleEditActivity = (activityId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering parent click events
    }
    openActivityDrawer(String(activityId));
  }

  return (
    <div className="h-full flex flex-col">
      {/* List Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Activities ({sortedActivities.length})
          </h2>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <div className="flex space-x-2">
            {[
              { key: 'title' as SortField, label: 'Title' },
              { key: 'start' as SortField, label: 'Start Date' },
              { key: 'end' as SortField, label: 'End Date' },
              { key: 'ring' as SortField, label: 'Ring' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`
                  px-3 py-1 text-sm rounded-md transition-colors
                  ${sortBy === key 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                {label}
                {sortBy === key && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-auto">
        {sortedActivities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No activities found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or add some activities.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedActivities.map(activity => {
              const isExpanded = expandedActivities.has(activity.id)
              const labels = getLabelsForActivity(activity)

              return (
                <div
                  key={activity.id}
                  className="p-4 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer rounded-md hover:shadow-md hover:border-primary-500 dark:hover:border-primary-400 hover:scale-[1.01] transform origin-left"
                  onClick={() => handleEditActivity(activity.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: activity.color || activity.ringColor || '#3b82f6' }}
                        />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.ringName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(parseISO(activity.start), 'MMM dd, yyyy')}
                            {activity.end && ` - ${format(parseISO(activity.end), 'MMM dd, yyyy')}`}
                          </span>
                        </div>
                      </div>

                      {labels.length > 0 && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {labels.map(label => (
                              <span
                                key={label.id}
                                className="px-2 py-1 text-xs rounded-full"
                                style={{ 
                                  backgroundColor: label.color + '20',
                                  color: label.color
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {activity.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleEditActivity(activity.id, e)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Edit activity"
                      >
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => toggleExpanded(activity.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Start:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {format(parseISO(activity.start), 'PPpp')}
                          </span>
                        </div>
                        {activity.end && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">End:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {format(parseISO(activity.end), 'PPpp')}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Ring:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {activity.ringName}
                          </span>
                        </div>
                        {activity.attachments && activity.attachments.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Attachments:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {activity.attachments.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
