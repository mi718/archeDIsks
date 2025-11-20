import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDiscStore } from '@/stores/disc-store'
import { useUIStore } from '@/stores/ui-store'
import type { Activity, Disc, ActivityFormData } from '@/types'
import { activityFormSchema } from '@/lib/validation'

interface ActivityDrawerProps {
  isOpen: boolean
  onClose: () => void
  activity?: Activity | null
  disc: Disc
}

export const ActivityDrawer = ({ isOpen, onClose, activity, disc }: ActivityDrawerProps) => {
  const { saveDisc } = useDiscStore()
  const { closeActivityDrawer } = useUIStore()
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRingId, setSelectedRingId] = useState(disc.rings[0]?.id || '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: '',
      description: '',
      start: '',
      end: '',
      color: '#3b82f6',
      labelIds: []
    }
  })

  // Convert ISO date string to YYYY-MM-DD format for date inputs
  const formatDateForInput = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch {
      console.error('Invalid date format:', isoString);
      return '';
    }
  };

  useEffect(() => {
    if (activity) {
      reset({
        title: activity.title,
        description: activity.description || '',
        start: formatDateForInput(activity.start),
        end: activity.end ? formatDateForInput(activity.end) : '',
        color: activity.color || '#3b82f6',
        labelIds: activity.labelIds || []
      })
      setSelectedRingId(activity.ringId)
    } else {
      reset({
        title: '',
        description: '',
        start: '',
        end: '',
        color: '#3b82f6',
        labelIds: []
      })
      setSelectedRingId(disc.rings[0]?.id || '')
    }
  }, [activity, reset])

  const toISODateString = (date: string) => {
    // If already ISO with time, return as is
    if (date.includes('T')) return date;
    // Convert YYYY-MM-DD to YYYY-MM-DDT00:00:00.000Z (UTC)
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day)).toISOString();
    }
    return '';
  };

  const onSubmit = async (data: ActivityFormData) => {
    setIsSaving(true)
    try {
      const newActivity: Activity = {
        id: activity?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ringId: selectedRingId,
        title: data.title,
        description: data.description,
        start: toISODateString(data.start),
        end: data.end ? toISODateString(data.end) : undefined,
        color: data.color,
        labelIds: data.labelIds,
        attachments: activity?.attachments || [],
        recurrence: data.recurrence
      }

      // Update the disc with the new/updated activity
      const updatedRings = disc.rings.map(ring => {
        if (ring.id === newActivity.ringId) {
          const existingActivities = ring.activities || []
          const activityIndex = existingActivities.findIndex(a => a.id === newActivity.id)

          let updatedActivities
          if (activityIndex >= 0) {
            // Update existing activity
            updatedActivities = [...existingActivities]
            updatedActivities[activityIndex] = newActivity
          } else {
            // Add new activity
            updatedActivities = [...existingActivities, newActivity]
          }

          return { ...ring, activities: updatedActivities }
        }
        return ring
      })

      const updatedDisc = {
        ...disc,
        rings: updatedRings
      }

      await saveDisc(updatedDisc)
      closeActivityDrawer()
    } catch (error) {
      console.error('Failed to save activity:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    closeActivityDrawer()
    onClose()
  }

  const handleDelete = async () => {
    if (!activity) return

    setIsSaving(true)
    try {
      // Remove the activity from its ring
      const updatedRings = disc.rings.map(ring => {
        if (ring.id === activity.ringId) {
          const existingActivities = ring.activities || []
          const updatedActivities = existingActivities.filter(a => a.id !== activity.id)
          return { ...ring, activities: updatedActivities }
        }
        return ring
      })

      const updatedDisc = {
        ...disc,
        rings: updatedRings
      }

      await saveDisc(updatedDisc)
      closeActivityDrawer()
    } catch (error) {
      console.error('Failed to delete activity:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const ringOptions = disc.rings.map(ring => ({
    value: ring.id,
    label: ring.name
  }))

  const labelOptions = disc.labels.map(label => ({
    value: label.id,
    label: label.name
  }))

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={activity ? 'Edit Activity' : 'New Activity'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Title"
          {...register('title')}
          error={errors.title?.message}
          placeholder="Enter activity title"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            rows={3}
            placeholder="Enter activity description"
          />
          {errors.description && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            {...register('start')}
            error={errors.start?.message}
          />
          <Input
            label="End Date"
            type="date"
            {...register('end')}
            error={errors.end?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Color"
            type="color"
            {...register('color')}
            error={errors.color?.message}
          />
          <Select
            label="Ring"
            options={ringOptions}
            value={selectedRingId}
            onChange={(e) => setSelectedRingId(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Labels
          </label>
          <div className="space-y-2">
            {labelOptions.map(label => (
              <label key={label.value} className="flex items-center">
                <input
                  type="checkbox"
                  value={label.value}
                  {...register('labelIds')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {label.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {activity && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : activity ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}
