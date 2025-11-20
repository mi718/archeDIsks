import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDiscStore } from '@/stores/disc-store'
import { useUIStore } from '@/stores/ui-store'
import type { Label, Disc, LabelFormData } from '@/types'
import { labelFormSchema } from '@/lib/validation'
import { CirclePicker } from 'react-color'
import { getPaletteColors } from '@/lib/color-palettes'

interface LabelDrawerProps {
  isOpen: boolean
  onClose: () => void
  disc: Disc
  selectedLabelId?: string
}

export const LabelDrawer = ({ isOpen, onClose, disc, selectedLabelId }: LabelDrawerProps) => {
  const { saveDisc } = useDiscStore()
  const { closeLabelDrawer } = useUIStore()
  const [isSaving, setIsSaving] = useState(false)

  // Find the label by selectedLabelId, or null if creating new
  const editingLabel = selectedLabelId 
    ? disc.labels.find(label => label.id === selectedLabelId) 
    : null;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<LabelFormData>({
    resolver: zodResolver(labelFormSchema),
    defaultValues: {
      name: '',
      color: '#3b82f6'
    }
  })

  // Update form when editing label changes
  useEffect(() => {
    if (editingLabel) {
      reset({
        name: editingLabel.name,
        color: editingLabel.color
      });
    } else {
      reset({
        name: '',
        color: '#3b82f6'
      });
    }
  }, [editingLabel, reset]);

  const onSubmit = async (data: LabelFormData) => {
    setIsSaving(true)
    try {
      if (editingLabel) {
        // Update existing label
        const updatedLabel: Label = {
          ...editingLabel,
          name: data.name,
          color: data.color
        }

        const updatedLabels = disc.labels.map(label => 
          label.id === updatedLabel.id ? updatedLabel : label
        )

        const updatedDisc = {
          ...disc,
          labels: updatedLabels
        }

        await saveDisc(updatedDisc)
      } else {
        // Create new label
        const newLabel: Label = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: data.name,
          color: data.color
        }

        const updatedDisc = {
          ...disc,
          labels: [...disc.labels, newLabel]
        }

        await saveDisc(updatedDisc)
      }

      closeLabelDrawer()
      reset()
    } catch (error) {
      console.error('Failed to save label:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingLabel) return

    setIsSaving(true)
    try {
      // Check if any activities use this label
      let labelInUse = false;

      for (const ring of disc.rings) {
        if (ring.activities) {
          for (const activity of ring.activities) {
            if (activity.labelIds && activity.labelIds.includes(editingLabel.id)) {
              labelInUse = true;
              break;
            }
          }
        }
        if (labelInUse) break;
      }

      if (labelInUse) {
        // Show confirmation or handle this case
        if (!window.confirm('This label is used by one or more activities. Deleting it will remove it from those activities. Continue?')) {
          setIsSaving(false)
          return
        }

        // Remove label from all activities that use it
        const updatedRings = disc.rings.map(ring => {
          if (!ring.activities) return ring;

          const updatedActivities = ring.activities.map(activity => {
            if (!activity.labelIds) return activity;

            return {
              ...activity,
              labelIds: activity.labelIds.filter(id => id !== editingLabel.id)
            };
          });

          return { ...ring, activities: updatedActivities };
        });

        // Remove the label
        const updatedLabels = disc.labels.filter(label => label.id !== editingLabel.id);

        const updatedDisc = {
          ...disc,
          rings: updatedRings,
          labels: updatedLabels
        };

        await saveDisc(updatedDisc);
      } else {
        // Just remove the label
        const updatedLabels = disc.labels.filter(label => label.id !== editingLabel.id);

        const updatedDisc = {
          ...disc,
          labels: updatedLabels
        };

        await saveDisc(updatedDisc);
      }

      closeLabelDrawer()
    } catch (error) {
      console.error('Failed to delete label:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteLabel = async (labelId: string) => {
    const labelToDelete = disc.labels.find(label => label.id === labelId)
    if (!labelToDelete) return

    setIsSaving(true)
    try {
      // Check if any activities use this label
      let labelInUse = false;

      for (const ring of disc.rings) {
        if (ring.activities) {
          for (const activity of ring.activities) {
            if (activity.labelIds && activity.labelIds.includes(labelId)) {
              labelInUse = true;
              break;
            }
          }
        }
        if (labelInUse) break;
      }

      if (labelInUse) {
        if (!window.confirm('This label is used by one or more activities. Deleting it will remove it from those activities. Continue?')) {
          setIsSaving(false)
          return
        }

        // Remove label from all activities that use it
        const updatedRings = disc.rings.map(ring => {
          if (!ring.activities) return ring;

          const updatedActivities = ring.activities.map(activity => {
            if (!activity.labelIds) return activity;

            return {
              ...activity,
              labelIds: activity.labelIds.filter(id => id !== labelId)
            };
          });

          return { ...ring, activities: updatedActivities };
        });

        // Remove the label
        const updatedLabels = disc.labels.filter(label => label.id !== labelId);

        const updatedDisc = {
          ...disc,
          rings: updatedRings,
          labels: updatedLabels
        };

        await saveDisc(updatedDisc);
      } else {
        // Just remove the label
        const updatedLabels = disc.labels.filter(label => label.id !== labelId);

        const updatedDisc = {
          ...disc,
          labels: updatedLabels
        };

        await saveDisc(updatedDisc);
      }
    } catch (error) {
      console.error('Failed to delete label:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    closeLabelDrawer()
    onClose()
    reset()
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Label"
      size="md"
    >
      <div className="space-y-6">
        {/* Form for creating/editing labels */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Enter label name"
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

          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            {editingLabel && (
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
                {isSaving ? 'Saving...' : editingLabel ? 'Update Label' : 'Create Label'}
              </Button>
            </div>
          </div>
        </form>

        {/* Labels list */}
        {disc.labels.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              All Labels ({disc.labels.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {disc.labels.map(label => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label.name}</span>
                  </div>
                  <button
                    onClick={() => deleteLabel(label.id)}
                    disabled={isSaving}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors"
                    title="Delete label"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
