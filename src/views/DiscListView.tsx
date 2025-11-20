import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Tag, Trash2, Circle, Folder, ChevronDown, ChevronRight, FolderX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDiscStore } from '@/stores/disc-store'
import { useUIStore } from '@/stores/ui-store'
import { formatDate } from '@/lib/date-utils'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/FormElements'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { COLOR_PALETTES } from '@/lib/color-palettes'

export const DiscListView = () => {
  const navigate = useNavigate()
  const { discs, folders, isLoading, error, deleteDisc, createFolder, moveDiscToFolder, deleteFolder } = useDiscStore()
  const [isCreating, setIsCreating] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    startMonth: new Date().getMonth(),
    colorPaletteId: 'meadow'
  })
  const [formErrors, setFormErrors] = useState({
    name: '',
    startMonth: ''
  })
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderError, setFolderError] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const initial = new Set<string>(['root'])
    if (folders.length > 0) {
      initial.add(folders[0].id)
    }
    return initial
  })
  const [draggedDiscId, setDraggedDiscId] = useState<string | null>(null)
  const filters = useUIStore((state) => state.filters);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [discToDelete, setDiscToDelete] = useState<string | null>(null);
  const [folderDeleteConfirmOpen, setFolderDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const handleDeleteDisc = async (e: React.MouseEvent, id: string) => {
    // Prevent the click from navigating to the disc view
    e.stopPropagation();
    setDiscToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!discToDelete) return;
    setDeleteConfirmOpen(false);
    setDeletingId(discToDelete);
    try {
      await deleteDisc(discToDelete);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(null);
      setDiscToDelete(null);
    }
  };

  const handleCreateDisc = () => {
    setFormData({ 
      name: '', 
      startMonth: new Date().getMonth(),
      colorPaletteId: 'meadow'
    })
    setIsFormOpen(true)
  }

  const handleCreateFolder = () => {
    setFolderName('')
    setFolderError('')
    setIsFolderModalOpen(true)
  }

  const handleFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!folderName.trim()) {
      setFolderError('Folder name is required')
      return
    }

    createFolder(folderName)
    
    setIsFolderModalOpen(false)
    setFolderName('')
    setFolderError('')
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleDragStart = (e: React.DragEvent, discId: string) => {
    setDraggedDiscId(discId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnFolder = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    if (draggedDiscId) {
      await moveDiscToFolder(draggedDiscId, folderId)
      setDraggedDiscId(null)
    }
  }

  const handleDropOnRoot = async (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedDiscId) {
      await moveDiscToFolder(draggedDiscId, null)
      setDraggedDiscId(null)
    }
  }

  const handleFolderDelete = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    setFolderToDelete(folderId)
    setFolderDeleteConfirmOpen(true)
  }

  const confirmFolderDelete = async () => {
    if (!folderToDelete) return
    setFolderDeleteConfirmOpen(false)
    try {
      await deleteFolder(folderToDelete)
    } catch (error) {
      console.error('Failed to delete folder:', error)
    } finally {
      setFolderToDelete(null)
    }
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
        labels: [],
        colorPaletteId: formData.colorPaletteId
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Discs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your circular planning discs
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 w-full md:w-auto">
          <Button
            onClick={handleCreateDisc}
            disabled={isCreating}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{isCreating ? 'Creating...' : 'New Disc'}</span>
          </Button>
          <Button
            onClick={handleCreateFolder}
            className="flex items-center space-x-2"
            variant="secondary"
          >
            <Folder className="h-4 w-4" />
            <span>New Folder</span>
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
            
            {/* Color Palette Selector */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Color Palette
              </label>
              <div className="grid grid-cols-2 gap-3">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, colorPaletteId: palette.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.colorPaletteId === palette.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: palette.baseColor }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {palette.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {palette.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-2 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {palette.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {palette.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

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

        {/* New Folder Modal */}
        <Modal
          isOpen={isFolderModalOpen}
          onClose={() => {
            setIsFolderModalOpen(false)
            setFolderName('')
            setFolderError('')
          }}
          title="Create New Folder"
        >
          <form onSubmit={handleFolderSubmit}>
            <Input
              label="Folder Name"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value)
                if (folderError) {
                  setFolderError('')
                }
              }}
              required
              error={folderError}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsFolderModalOpen(false)
                  setFolderName('')
                  setFolderError('')
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="w-auto"
              >
                Create Folder
              </Button>
            </div>
          </form>
        </Modal>

      {discs.length === 0 && folders.length === 0 ? (
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
        <div className="space-y-6">
          {/* Root level discs - always visible */}
          <div 
            className={`rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 min-h-64 transition-colors ${draggedDiscId ? 'border-blue-500' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDropOnRoot}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Root</h2>
            {discs.filter(d => !d.folderId).length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Drag discs here or create a new one</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discs.filter(d => !d.folderId).map((disc) => {
                  const search = filters.textSearch || '';
                  const matches = disc.name.toLowerCase().includes(search.toLowerCase());
                  return (
                    <div
                      key={disc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, disc.id)}
                      onDragEnd={() => setDraggedDiscId(null)}
                      className={`card hover:shadow-lg transition-shadow cursor-move ${!matches && search ? 'opacity-40 grayscale pointer-events-none' : ''} ${draggedDiscId === disc.id ? 'opacity-50' : ''}`}
                      onClick={() => matches && navigate(`/disc/${disc.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {disc.name}
                        </h3>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <Circle className="h-4 w-4" />
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
                  );
                })}
              </div>
            )}
          </div>

          {/* Folders */}
          {folders.map((folder) => {
            const folderDiscs = discs.filter(d => d.folderId === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const search = filters.textSearch || '';
            const hasMatchingDisc = folderDiscs.some(disc => disc.name.toLowerCase().includes(search.toLowerCase()));
            
            return (
              <div key={folder.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${draggedDiscId ? 'border-2 border-dashed border-blue-500' : ''} ${hasMatchingDisc && search ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => toggleFolder(folder.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnFolder(e, folder.id)}
                  onDragLeave={() => {}}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                    <Folder className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{folder.name}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({folderDiscs.length})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleFolderDelete(e, folder.id)}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <FolderX className="h-4 w-4" />
                  </Button>
                </div>

                {isExpanded && (
                  <div 
                    className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 min-h-64"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnFolder(e, folder.id)}
                  >
                    {folderDiscs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Drag discs here or create a new one</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {folderDiscs.map((disc) => {
                          const search = filters.textSearch || '';
                          const matches = disc.name.toLowerCase().includes(search.toLowerCase());
                          return (
                            <div
                              key={disc.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, disc.id)}
                              onDragEnd={() => setDraggedDiscId(null)}
                              className={`card hover:shadow-lg transition-shadow cursor-move ${!matches && search ? 'opacity-40 grayscale pointer-events-none' : ''} ${draggedDiscId === disc.id ? 'opacity-50' : ''}`}
                              onClick={() => matches && navigate(`/disc/${disc.id}`)}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {disc.name}
                                </h3>
                                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Circle className="h-4 w-4" />
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
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog for Discs */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Disc"
        message="Are you sure you want to delete this disc? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDiscToDelete(null);
        }}
      />

      {/* Delete Confirmation Dialog for Folders */}
      <ConfirmDialog
        isOpen={folderDeleteConfirmOpen}
        title="Delete Folder"
        message="Are you sure you want to delete this folder? All discs in this folder will be moved to the root level. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDangerous={true}
        onConfirm={confirmFolderDelete}
        onCancel={() => {
          setFolderDeleteConfirmOpen(false);
          setFolderToDelete(null);
        }}
      />
    </div>
  )
}
