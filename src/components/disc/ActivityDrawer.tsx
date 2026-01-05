import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { useDiscStore } from '@/stores/disc-store'
import { useUIStore } from '@/stores/ui-store'
import type { Activity, Disc, ActivityFormData } from '@/types'
import { activityFormSchema } from '@/lib/validation'
import { CirclePicker } from 'react-color'
import { getPaletteColors } from '@/lib/color-palettes'

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
    control,
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

  // Convert ISO date string to DD-MM-YYYY format for date inputs
  const formatDateForInput = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}-${month}-${year}`; // Returns DD-MM-YYYY
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
    // Convert DD-MM-YYYY to YYYY-MM-DDT00:00:00.000Z (UTC)
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [day, month, year] = date.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day)).toISOString();
    }
    return '';
  };

  const handleDateInput = (value: string) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as DD-MM-YYYY
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
    }
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('title')}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-primary-400 transition-all ${
              errors.title
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600'
            }`}
            placeholder="Enter activity title"
          />
          {errors.title && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <span className="mr-1">⚠</span>
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            {...register('description')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-primary-400 transition-all resize-none"
            rows={3}
            placeholder="Enter activity description"
          />
          {errors.description && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
                <span className="text-gray-500 text-xs ml-1">(DD-MM-YYYY)</span>
              </label>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                {...register('start', {
                  onChange: (e) => {
                    e.target.value = handleDateInput(e.target.value);
                  }
                })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-primary-400 transition-all ${
                  errors.start
                    ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600'
                }`}
              />
              {errors.start && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.start.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
                <span className="text-gray-500 text-xs ml-1">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                {...register('end', {
                  onChange: (e) => {
                    e.target.value = handleDateInput(e.target.value);
                  }
                })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-primary-400 transition-all ${
                  errors.end
                    ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600'
                }`}
              />
              {errors.end && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.end.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <Controller
            name="color"
            control={control}
            render={({ field }) => {
              const availableColors = disc.colorPaletteId
                ? getPaletteColors(disc.colorPaletteId)
                : ['#3B82F6']
              return (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Activity Color
                  </label>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <CirclePicker
                      color={field.value}
                      colors={availableColors}
                      onChangeComplete={(color) => field.onChange(color.hex)}
                      width="100%"
                    />
                  </div>
                </div>
              )
            }}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ring
            </label>
            <select
              value={selectedRingId}
              onChange={(e) => setSelectedRingId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-primary-400 transition-all bg-white dark:bg-gray-700"
            >
              {ringOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Labels
          </label>
          <div className="space-y-2">
            {labelOptions.map(label => (
              <label key={label.value} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  value={label.value}
                  {...register('labelIds')}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label.label}
                </span>
              </label>
            ))}
            {labelOptions.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No labels available
              </p>
            )}
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
