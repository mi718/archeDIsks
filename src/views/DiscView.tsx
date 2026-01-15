import { useEffect, useState, useRef } from 'react'
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
import { useMemo } from 'react'

export const DiscView = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { 
    currentDisc, 
    loadDisc, 
    saveDisc, 
    isLoading, 
    error,
    discs // <-- add discs from store
  } = useDiscStore()

  const {
    viewMode,
    isActivityDrawerOpen,
    isRingDrawerOpen,
    isLabelDrawerOpen,
    isFilterDrawerOpen,
    selectedActivityId,
    selectedRingId,
    closeActivityDrawer,
    openRingDrawer,
    closeRingDrawer,
    openLabelDrawer,
    closeLabelDrawer,
    openFilterDrawer,
    closeFilterDrawer
  } = useUIStore()

  const filters = useUIStore(state => state.filters);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start: '',
    end: '',
    duration: 'yearly' as 'yearly' | 'quarterly' | 'monthly',
    startMonth: new Date().getMonth(),
    startYear: new Date().getFullYear(),
    defaultTimeUnit: 'month' as 'month' | 'week' | 'day' | 'quarter',
    rings: [],
    labels: [],
    colorPaletteId: 'meadow',
    folderId: undefined as string | undefined
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    startMonth: '',
    startYear: '',
    defaultTimeUnit: ''
  });
  const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);

  // Filter and sort rings for the legend
  const legendRings = useMemo(() => {
    if (!currentDisc) return [];
    
    const filteredRings = filters.ringIds.length > 0
      ? currentDisc.rings.filter(ring => filters.ringIds.includes(ring.id))
      : currentDisc.rings;

    return [...filteredRings].sort((a, b) => {
      if (a.type === 'thin' && b.type !== 'thin') return 1;
      if (a.type !== 'thin' && b.type === 'thin') return -1;
      return 0;
    });
  }, [currentDisc, filters.ringIds]);

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

  // Track if we've already tried to load the disc for this id
  const hasTriedLoadRef = useRef<string | null>(null)

  useEffect(() => {
    // Only attempt to load the disc if discs have been loaded (not loading)
    if (id && id !== 'new' && !isLoading && discs.length > 0 && hasTriedLoadRef.current !== id) {
      loadDisc(id)
      hasTriedLoadRef.current = id
    }
    // Reset ref if id changes
    if (hasTriedLoadRef.current && hasTriedLoadRef.current !== id) {
      hasTriedLoadRef.current = null
    }
  }, [id, loadDisc, isLoading, discs.length])

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
      startMonth: '',
      startYear: '',
      defaultTimeUnit: ''
    };

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Disk name is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleDurationChange = (value: string) => {
    const duration = value as 'yearly' | 'quarterly' | 'monthly';
    let defaultTimeUnit = formData.defaultTimeUnit;
    if (duration === 'monthly' && (defaultTimeUnit === 'month' || (defaultTimeUnit) === 'quarter')) {
      defaultTimeUnit = 'week';
    } else if (duration === 'quarterly' && (defaultTimeUnit) === 'quarter') {
      defaultTimeUnit = 'month';
    }
    setFormData({ ...formData, duration, defaultTimeUnit });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, startYear: parseInt(e.target.value) || new Date().getFullYear() });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    const startYear = formData.startYear;
    const selectedMonth = formData.startMonth;
    const duration = formData.duration;

    let endYear = startYear;
    let endMonth = selectedMonth;

    if (duration === 'yearly') {
      endYear = selectedMonth === 0 ? startYear : startYear + 1;
      endMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    } else if (duration === 'quarterly') {
      endMonth = selectedMonth + 2;
      if (endMonth > 11) {
        endMonth -= 12;
        endYear += 1;
      }
    } else if (duration === 'monthly') {
      // endMonth is the same as selectedMonth, endYear is same as startYear
      // The day calculation will take care of the rest
    }

    const endDay = new Date(endYear, endMonth + 1, 0).getDate(); // Last day of the end month

    const newDisc: Disc = {
      id: crypto.randomUUID(),
      name: formData.name,
      start: new Date(startYear, selectedMonth, 1).toISOString(),
      end: new Date(endYear, endMonth, endDay).toISOString(),
      defaultTimeUnit: formData.defaultTimeUnit,
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
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <Input
                  label="Name of Disk"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  error={formErrors.name}
                />
                
                <Select
                  label="Disc Duration"
                  options={[
                    { value: 'yearly', label: 'Yearly (12 Months)' },
                    { value: 'quarterly', label: 'Quarterly (3 Months)' },
                    { value: 'monthly', label: 'Monthly (1 Month)' }
                  ]}
                  value={formData.duration}
                  onChange={handleDurationChange}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
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
                  <Input
                    label="Start Year"
                    type="number"
                    value={formData.startYear.toString()}
                    onChange={handleYearChange}
                    required
                  />
                </div>
                
                <Select
                  label="Default Time Unit"
                  options={[
                    { value: 'day', label: 'Day' },
                    { value: 'week', label: 'Week' },
                    { value: 'month', label: 'Month' },
                    { value: 'quarter', label: 'Quarter' }
                  ].filter(option => {
                    if (formData.duration === 'monthly') {
                      return option.value === 'day' || option.value === 'week';
                    } else if (formData.duration === 'quarterly') {
                      return option.value === 'day' || option.value === 'week' || option.value === 'month';
                    }
                    return true;
                  })}
                  value={formData.defaultTimeUnit}
                  onChange={handleSelectChange}
                  required
                />
                
                <div className="pt-2">
                  <Button type="submit" className="w-full py-2.5 text-base font-semibold">
                    Create Disk
                  </Button>
                </div>
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
            {/* Legend - Desktop */}
            <div className="hidden md:block absolute top-6 left-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm pt-3 px-3 pb-8 rounded-lg border border-gray-200 dark:border-gray-700 z-10">
              <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Rings Legend</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {legendRings.map(ring => (
                  <div key={ring.id} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-black/10" 
                      style={{ backgroundColor: ring.color || '#3b82f6' }}
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {ring.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend - Mobile Button */}
            <div className="md:hidden absolute top-4 left-4 z-10">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsLegendModalOpen(true)}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm"
              >
                Rings Legend
              </Button>
            </div>

            {/* Legend Modal */}
            <Modal
              isOpen={isLegendModalOpen}
              onClose={() => setIsLegendModalOpen(false)}
              title="Rings Legend"
            >
              <div className="space-y-3 pb-8">
                {legendRings.map(ring => (
                  <div key={ring.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div 
                      className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0" 
                      style={{ backgroundColor: ring.color || '#3b82f6' }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {ring.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsLegendModalOpen(false)}>Close</Button>
              </div>
            </Modal>

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
        selectedRingId={selectedRingId}
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
