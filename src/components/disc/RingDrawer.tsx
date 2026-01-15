import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDiscStore } from '@/stores/disc-store'
import { useUIStore } from '@/stores/ui-store'
import type { Ring, Disc, RingFormData } from '@/types'
import { ringFormSchema } from '@/lib/validation'
import { CirclePicker } from 'react-color'
import { getPaletteColors } from '@/lib/color-palettes'

interface RingDrawerProps {
  isOpen: boolean
  onClose: () => void
  disc: Disc
  selectedRingId?: string
}

export const RingDrawer = ({ isOpen, onClose, disc, selectedRingId }: RingDrawerProps) => {
  const { saveDisc } = useDiscStore()
  const { closeRingDrawer } = useUIStore()
  const [isSaving, setIsSaving] = useState(false)

  // Find the ring by selectedRingId, or null if creating new
  const editingRing = selectedRingId 
    ? disc.rings.find(ring => ring.id === selectedRingId) 
    : null;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<RingFormData>({
    resolver: zodResolver(ringFormSchema),
    defaultValues: {
      name: '',
      type: 'normal',
      color: '#3b82f6',
      timeUnit: disc.defaultTimeUnit
    }
  })

  // Update form when editing ring changes
  useEffect(() => {
    if (editingRing) {
      reset({
        name: editingRing.name,
        type: editingRing.type,
        color: editingRing.color || '#3b82f6',
        timeUnit: editingRing.timeUnit || disc.defaultTimeUnit
      });
    } else {
      reset({
        name: '',
        type: 'normal',
        color: '#3b82f6',
        timeUnit: disc.defaultTimeUnit
      });
    }
  }, [editingRing, reset, disc.defaultTimeUnit]);

  const onSubmit = async (data: RingFormData) => {
    setIsSaving(true)
    try {
      if (editingRing) {
        // Update existing ring
        const updatedRing: Ring = {
          ...editingRing,
          name: data.name,
          type: data.type,
          color: data.color,
          timeUnit: data.timeUnit
        }

        const updatedRings = disc.rings.map(ring => 
          ring.id === updatedRing.id ? updatedRing : ring
        )

        const updatedDisc = {
          ...disc,
          rings: updatedRings
        }

        await saveDisc(updatedDisc)
      } else {
        // Create new ring
        const newRing: Ring = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: data.name,
          type: data.type,
          color: data.color,
          timeUnit: data.timeUnit,
          readOnly: false
        }

        const updatedDisc = {
          ...disc,
          rings: [...disc.rings, newRing]
        }

        await saveDisc(updatedDisc)
      }

      closeRingDrawer()
      reset()
    } catch (error) {
      console.error('Failed to save ring:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingRing) return

    setIsSaving(true)
    try {
      // Check if ring has activities
      const hasActivities = editingRing.activities && editingRing.activities.length > 0

      if (hasActivities) {
        // Show confirmation or handle this case
        if (!window.confirm('This ring has activities. Deleting it will also delete all its activities. Continue?')) {
          setIsSaving(false)
          return
        }
      }

      // Remove the ring
      const updatedRings = disc.rings.filter(ring => ring.id !== editingRing.id)

      const updatedDisc = {
        ...disc,
        rings: updatedRings
      }

      await saveDisc(updatedDisc)
      closeRingDrawer()
    } catch (error) {
      console.error('Failed to delete ring:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    closeRingDrawer()
    onClose()
    reset()
  }

  const ringTypeOptions = [
    { value: 'normal', label: 'Normal Ring' },
    { value: 'thin', label: 'Thin Ring' }
  ]

  const timeUnitOptions = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' }
  ].filter(option => {
    const days = (new Date(disc.end).getTime() - new Date(disc.start).getTime()) / (1000 * 60 * 60 * 24) + 1;
    
    if (days <= 32) { // Monthly
      return option.value === 'day' || option.value === 'week';
    } else if (days <= 100) { // Quarterly
      return option.value === 'day' || option.value === 'week' || option.value === 'month';
    }
    return true; // Yearly
  })

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={editingRing ? 'Edit Ring' : 'Add Ring'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Enter ring name"
        />

        <Select
          label="Type"
          options={ringTypeOptions}
          {...register('type')}
          error={errors.type?.message}
        />

        <Controller
          name="color"
          control={control}
          render={({ field }) => {
            // Get available colors from the disc's color palette
            const availableColors = disc.colorPaletteId 
              ? getPaletteColors(disc.colorPaletteId)
              : ['#3B82F6'] // Fallback if no palette
            
            return (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color
                </label>
                <CirclePicker
                  color={field.value}
                  colors={availableColors}
                  onChangeComplete={(color) => field.onChange(color.hex)}
                  width="100%"
                />
              </div>
            )
          }}
        />

        <Select
          label="Time Unit"
          options={timeUnitOptions}
          {...register('timeUnit')}
          error={errors.timeUnit?.message}
        />

        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {editingRing && (
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
              {isSaving ? 'Saving...' : editingRing ? 'Update Ring' : 'Create Ring'}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}
