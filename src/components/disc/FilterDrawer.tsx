import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUIStore } from '@/stores/ui-store'
import { GripVertical, Edit2 } from 'lucide-react'
import type { Disc, Ring } from '@/types'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  disc: Disc
}

export const FilterDrawer = ({ isOpen, onClose, disc }: FilterDrawerProps) => {
  const { 
    filters, 
    setFilters, 
    clearFilters, 
    closeFilterDrawer,
    setRingOrder,
    openRingDrawer
  } = useUIStore()

  const [tempFilters, setTempFilters] = useState(filters)
  const [orderedRings, setOrderedRings] = useState<Ring[]>([])
  const [draggedRingId, setDraggedRingId] = useState<string | null>(null)

  // Initialize ordered rings when the component mounts or disc changes
  useEffect(() => {
    if (disc && disc.rings) {
      // If we have a saved order, use it to sort the rings
      if (filters.ringOrder && filters.ringOrder.length > 0) {
        // Create a map for O(1) lookups
        const orderMap = new Map(filters.ringOrder.map((id, index) => [id, index]))

        // Sort rings based on the saved order, putting rings not in the order at the end
        const sorted = [...disc.rings].sort((a, b) => {
          const aIndex = orderMap.has(a.id) ? orderMap.get(a.id)! : Number.MAX_SAFE_INTEGER
          const bIndex = orderMap.has(b.id) ? orderMap.get(b.id)! : Number.MAX_SAFE_INTEGER
          return aIndex - bIndex
        })

        setOrderedRings(sorted)
      } else {
        // Otherwise use the default order from the disc
        setOrderedRings([...disc.rings])
      }
    }
  }, [disc, filters.ringOrder])

  // Handle drag start event
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ringId: string) => {
    setDraggedRingId(ringId)
    // Set the drag effect and data
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', ringId)
    // Add a class to the dragged element
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('dragging')
    }
  }

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    // Add a visual indicator for the drop target
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('drag-over')
    }
  }

  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Remove the visual indicator
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('drag-over')
    }
  }

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetRingId: string) => {
    e.preventDefault()

    // Remove visual indicators
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('drag-over')
    }

    const sourceRingId = e.dataTransfer.getData('text/plain')

    if (sourceRingId && sourceRingId !== targetRingId) {
      // Reorder the rings
      const newOrderedRings = [...orderedRings]
      const sourceIndex = newOrderedRings.findIndex(ring => ring.id === sourceRingId)
      const targetIndex = newOrderedRings.findIndex(ring => ring.id === targetRingId)

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const [movedRing] = newOrderedRings.splice(sourceIndex, 1)
        newOrderedRings.splice(targetIndex, 0, movedRing)
        setOrderedRings(newOrderedRings)

        // Update the ring order in the filter state
        const newRingOrder = newOrderedRings.map(ring => ring.id)
        setRingOrder(newRingOrder)
      }
    }

    setDraggedRingId(null)
  }

  // Handle drag end event
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Remove the dragging class
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('dragging')
    }
    setDraggedRingId(null)
  }

  const handleApplyFilters = () => {
    // Update the ring order in the filter state when applying filters
    if (orderedRings.length > 0) {
      const ringOrder = orderedRings.map(ring => ring.id)
      setFilters({
        ...tempFilters,
        ringOrder
      })
    } else {
      setFilters(tempFilters)
    }
    closeFilterDrawer()
    onClose()
  }

  const handleClearFilters = () => {
    setTempFilters({
      ringIds: [],
      labelIds: [],
      textSearch: '',
      dateRange: undefined,
      ringOrder: []
    })
    setOrderedRings([...disc.rings])
    clearFilters()
  }

  const handleClose = () => {
    closeFilterDrawer()
    onClose()
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Filter Activities"
      size="md"
    >
      <div className="space-y-6">
        {/* Text Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <Input
            value={tempFilters.textSearch}
            onChange={(e) => setTempFilters({ ...tempFilters, textSearch: e.target.value })}
            placeholder="Search activities..."
          />
        </div>

        {/* Ring Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rings
          </label>
          <div className="space-y-2">
            {orderedRings.map(ring => {
              const isThin = ring.type === 'thin';
              return (
                <div 
                  key={ring.id} 
                  className={`flex items-center p-2 rounded ${
                    isThin ? 'bg-gray-100 dark:bg-gray-700' : 'cursor-grab'
                  } ${draggedRingId === ring.id ? 'opacity-50' : ''}`}
                  draggable={!isThin}
                  onDragStart={!isThin ? (e) => handleDragStart(e, ring.id) : undefined}
                  onDragOver={!isThin ? handleDragOver : undefined}
                  onDragLeave={!isThin ? handleDragLeave : undefined}
                  onDrop={!isThin ? (e) => handleDrop(e, ring.id) : undefined}
                  onDragEnd={!isThin ? handleDragEnd : undefined}
                >
                  {!isThin && (
                    <div className="mr-2 text-gray-400 cursor-grab">
                      <GripVertical size={16} />
                    </div>
                  )}
                  <input
                    type="checkbox"
                    checked={tempFilters.ringIds.includes(ring.id)}
                    onChange={() => {
                      const newRingIds = tempFilters.ringIds.includes(ring.id)
                        ? tempFilters.ringIds.filter(id => id !== ring.id)
                        : [...tempFilters.ringIds, ring.id]
                      setTempFilters({ ...tempFilters, ringIds: newRingIds })
                    }}
                    className="mr-3 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {ring.name}
                  </span>
                  <button
                    onClick={() => {
                      closeFilterDrawer();
                      openRingDrawer(ring.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Edit Ring"
                  >
                    <Edit2 size={14} />
                  </button>
                  {isThin && (
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                      Thin Ring
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Label Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Labels
          </label>
          <div className="space-y-2">
            {disc.labels.map(label => (
              <label key={label.id} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempFilters.labelIds.includes(label.id)}
                  onChange={() => {
                    const newLabelIds = tempFilters.labelIds.includes(label.id)
                      ? tempFilters.labelIds.filter(id => id !== label.id)
                      : [...tempFilters.labelIds, label.id]
                    setTempFilters({ ...tempFilters, labelIds: newLabelIds })
                  }}
                  className="mr-3 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {label.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={tempFilters.dateRange?.start || ''}
              onChange={(e) => setTempFilters({
                ...tempFilters,
                dateRange: {
                  start: e.target.value,
                  end: tempFilters.dateRange?.end || ''
                }
              })}
            />
            <Input
              label="End Date"
              type="date"
              value={tempFilters.dateRange?.end || ''}
              onChange={(e) => setTempFilters({
                ...tempFilters,
                dateRange: {
                  start: tempFilters.dateRange?.start || '',
                  end: e.target.value
                }
              })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClearFilters}
          >
            Clear All
          </Button>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
