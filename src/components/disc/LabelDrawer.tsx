import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDiscStore } from '@/stores/disc-store'
import { useUIStore } from '@/stores/ui-store'
import type { Label, Disc, LabelFormData } from '@/types'
import { labelFormSchema } from '@/lib/validation'

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Enter label name"
        />

        <Input
          label="Color"
          type="color"
          {...register('color')}
          error={errors.color?.message}
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
    </Drawer>
  )
}
