import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Users, Tag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDiscStore } from '@/stores/disc-store'
import { formatDate } from '@/lib/date-utils'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/FormElements'

export const DiscListView = () => {
  const navigate = useNavigate()
  const { discs, isLoading, error, deleteDisc } = useDiscStore()
  const [isCreating, setIsCreating] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    startMonth: new Date().getMonth() 
  })
  const [formErrors, setFormErrors] = useState({
    name: '',
    startMonth: ''
  })

  const handleDeleteDisc = async (e: React.MouseEvent, id: string) => {
    // Prevent the click from navigating to the disc view
    e.stopPropagation();

    if (window.confirm('Are you sure you want to delete this disc?')) {
      setDeletingId(id);
      try {
        await deleteDisc(id);
      } catch (error) {
        console.error('Delete failed:', error);
      } finally {
        setDeletingId(null);
      }
    }
  }

  const handleCreateDisc = () => {
    setFormData({ 
      name: '', 
      startMonth: new Date().getMonth() 
    })
    setIsFormOpen(true)
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      const currentYear = new Date().getFullYear();
      const selectedMonth = formData.startMonth;

      // Calculate end date as 12 months from start date
      const endYear = selectedMonth === 0 ? currentYear : currentYear + 1;
      const endMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const endDay = new Date(endYear, endMonth + 1, 0).getDate(); // Last day of the end month

      const newDisc = await useDiscStore.getState().createDisc({
        name: formData.name,
        start: new Date(currentYear, selectedMonth, 1).toISOString(),
        end: new Date(endYear, endMonth, endDay).toISOString(),
        defaultTimeUnit: 'month',
        rings: [],
        labels: []
      });
      setIsFormOpen(false);
      navigate(`/disc/${newDisc.id}`);
    } catch (error) {
      console.error('Failed to create disc:', error);
    } finally {
      setIsCreating(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
    // Clear error when field is changed
    if (formErrors.name) {
      setFormErrors({ ...formErrors, name: '' });
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, startMonth: parseInt(value) });
    // Clear error when field is changed
    if (formErrors.startMonth) {
      setFormErrors({ ...formErrors, startMonth: '' });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading discs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              All Discs
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your circular planning discs
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleCreateDisc}
              disabled={isCreating}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{isCreating ? 'Creating...' : 'New Disc'}</span>
            </Button>
          </div>
        </div>

        {/* New Disc Modal */}
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
            <div className="mt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Disk'}
              </Button>
            </div>
          </form>
        </Modal>

      {discs.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No discs yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first circular planning disc to get started.
          </p>
          <Button onClick={handleCreateDisc} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Your First Disc'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discs.map((disc) => (
            <div
              key={disc.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/disc/${disc.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {disc.name}
                </h3>
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{disc.rings.length}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {formatDate(disc.start, 'MMM dd, yyyy')} - {formatDate(disc.end, 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Tag className="h-4 w-4 mr-2" />
                  <span>{disc.labels.length} labels</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Updated {formatDate(disc.updatedAt, 'MMM dd')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteDisc(e, disc.id)}
                  disabled={deletingId === disc.id}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
