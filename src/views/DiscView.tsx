import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CircularDisc } from '@/components/disc/CircularDisc'
import { CalendarView } from '@/components/views/CalendarView'
import { ListView } from '@/components/views/ListView'
import { ActivityDrawer } from '@/components/disc/ActivityDrawer'
import { RingDrawer } from '@/components/disc/RingDrawer'
import { LabelDrawer } from '@/components/disc/LabelDrawer'
import { FilterDrawer } from '@/components/disc/FilterDrawer'
import { useDiscStore } from '@/stores/disc-store'
import { useUIStore } from '@/stores/ui-store'
import type { Disc } from '@/types'
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/FormElements';
import { Button } from '@/components/ui/Button';

export const DiscView = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { 
    currentDisc, 
    loadDisc, 
    saveDisc, 
    isLoading, 
    error 
  } = useDiscStore()

  const {
    viewMode,
    isActivityDrawerOpen,
    isRingDrawerOpen,
    isLabelDrawerOpen,
    isFilterDrawerOpen,
    selectedActivityId,
    closeActivityDrawer,
    openRingDrawer,
    closeRingDrawer,
    openLabelDrawer,
    closeLabelDrawer,
    openFilterDrawer,
    closeFilterDrawer
  } = useUIStore()

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', startMonth: new Date().getMonth() });
  const [formErrors, setFormErrors] = useState({
    name: '',
    startMonth: ''
  });

  // Helper to find activity by id
  const findActivityById = (id: string | undefined | null) => {
    if (!id || !currentDisc) return null;
    for (const ring of currentDisc.rings) {
      const found = ring.activities?.find(a => String(a.id) === String(id));
      if (found) return found;
    }
    return null;
  };

  // Find the activity by selectedActivityId
  const selectedActivity = findActivityById(selectedActivityId);

  useEffect(() => {
    if (id && id !== 'new') {
      loadDisc(id)
    }
  }, [id, loadDisc])

  const handleAddRing = () => {
    openRingDrawer()
  }

  const handleAddLabel = () => {
    openLabelDrawer()
  }

  const validateForm = () => {
    let isValid = true;
    const errors = {
      name: '',
      startMonth: ''
    };

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Disk name is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    const currentYear = new Date().getFullYear();
    const selectedMonth = formData.startMonth;

    // Calculate end date as 12 months from start date
    const endYear = selectedMonth === 0 ? currentYear : currentYear + 1;
    const endMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const endDay = new Date(endYear, endMonth + 1, 0).getDate(); // Last day of the end month

    const newDisc: Disc = {
      id: crypto.randomUUID(),
      name: formData.name,
      start: new Date(currentYear, selectedMonth, 1).toISOString(),
      end: new Date(endYear, endMonth, endDay).toISOString(),
      defaultTimeUnit: 'month',
      rings: [],
      labels: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDisc(newDisc);
    setIsFormOpen(false);
    navigate(`/disc/${newDisc.id}`); // Navigate to the newly created disc
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
    // Clear error when field is changed
    if (formErrors.name) {
      setFormErrors({ ...formErrors, name: '' });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, startMonth: parseInt(value) });
    // Clear error when field is changed
    if (formErrors.startMonth) {
      setFormErrors({ ...formErrors, startMonth: '' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading disc...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!currentDisc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No discs yet</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Create Your First Disc
          </button>
          {isFormOpen && (
            <Modal
              isOpen={isFormOpen}
              onClose={() => setIsFormOpen(false)}
              title="Create New Disk"
            >
              <form onSubmit={handleFormSubmit}>
                <Input
                  label="Name of Disk"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  error={formErrors.name}
                />
                <Select
                  label="Start Month"
                  options={[
                    { value: '0', label: 'January' },
                    { value: '1', label: 'February' },
                    { value: '2', label: 'March' },
                    { value: '3', label: 'April' },
                    { value: '4', label: 'May' },
                    { value: '5', label: 'June' },
                    { value: '6', label: 'July' },
                    { value: '7', label: 'August' },
                    { value: '8', label: 'September' },
                    { value: '9', label: 'October' },
                    { value: '10', label: 'November' },
                    { value: '11', label: 'December' }
                  ]}
                  value={formData.startMonth.toString()}
                  onChange={handleSelectChange}
                  required
                  error={formErrors.startMonth}
                />
                <Button type="submit">Create</Button>
              </form>
            </Modal>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentDisc.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentDisc.rings.length} rings • {currentDisc.labels.length} labels
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddRing}
              className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Add Ring
            </button>
            <button
              onClick={handleAddLabel}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Add Label
            </button>
            <button
              onClick={openFilterDrawer}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'disc' && (
          <div className="absolute inset-0 flex items-center justify-center p-6" data-disc-view>
            <CircularDisc
              disc={currentDisc}
            />
          </div>
        )}

        {viewMode === 'calendar' && (
          <CalendarView disc={currentDisc} />
        )}

        {viewMode === 'list' && (
          <ListView disc={currentDisc} />
        )}
      </div>

      {/* Drawers */}
      <ActivityDrawer
        isOpen={isActivityDrawerOpen}
        onClose={closeActivityDrawer}
        activity={selectedActivity}
        disc={currentDisc}
      />

      <RingDrawer
        isOpen={isRingDrawerOpen}
        onClose={closeRingDrawer}
        disc={currentDisc}
      />

      <LabelDrawer
        isOpen={isLabelDrawerOpen}
        onClose={closeLabelDrawer}
        disc={currentDisc}
      />

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        disc={currentDisc}
      />
    </div>
  )
}
