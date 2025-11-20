import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Home, 
  Trash2, 
  Calendar,
  List,
  Circle,
  Folder,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/ui-store'
import { useDiscStore } from '@/stores/disc-store'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { viewMode, setViewMode } = useUIStore()
  const { discs, folders, currentDisc, deleteDisc } = useDiscStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; discId: string | null }>({ open: false, discId: null })
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))

  const handleDeleteDisc = (id: string) => {
    setConfirmDialog({ open: true, discId: id })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDialog.discId) return
    setDeletingId(confirmDialog.discId)
    setConfirmDialog({ open: false, discId: null })
    try {
      await deleteDisc(confirmDialog.discId)
      if (currentDisc?.id === confirmDialog.discId) {
        navigate('/disc-list')
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeletingId(null)
    }
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

  const renderDiscItem = (disc: any) => (
    <div
      key={disc.id}
      className={`
        group flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
        ${location.pathname === `/disc/${disc.id}` ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
      `}
    >
      <button
        onClick={() => navigate(`/disc/${disc.id}`)}
        className="flex-1 text-left truncate"
      >
        <div className="font-medium text-gray-900 dark:text-white truncate">
          {disc.name}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {disc.rings.length} rings
        </div>
      </button>

      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteDisc(disc.id)}
          disabled={deletingId === disc.id}
          className="p-1 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )


  const viewModes = [
    { id: 'disc', label: 'Disc View', icon: Circle },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'list', label: 'List View', icon: List },
  ] as const

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out dark:bg-gray-800 dark:border-gray-700
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Discs
            </h2>
            <button
              onClick={onClose}
              className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <Button
              variant={location.pathname === '/disc-list' ? 'primary' : 'ghost'}
              onClick={() => navigate('/disc-list')}
              className={`w-full justify-start ${location.pathname === '/disc-list' ? '!bg-primary-700 dark:!bg-primary-700 hover:!bg-primary-50 dark:hover:!bg-primary-900/20' : ''}`}
            >
              <Home className="h-4 w-4 mr-2" />
              All Discs
            </Button>

            {/* Root discs */}
            {discs.filter(d => !d.folderId).length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => toggleFolder('root')}
                  className="flex items-center w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  {expandedFolders.has('root') ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <Folder className="h-4 w-4 mr-2" />
                  Root ({discs.filter(d => !d.folderId).length})
                </button>
                {expandedFolders.has('root') && (
                  <div className="ml-6 mt-1 space-y-1">
                    {discs.filter(d => !d.folderId).map(renderDiscItem)}
                  </div>
                )}
              </div>
            )}

            {/* Folders */}
            {folders.map((folder) => {
              const folderDiscs = discs.filter(d => d.folderId === folder.id)
              return (
                <div key={folder.id} className="mt-2">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <Folder className="h-4 w-4 mr-2" />
                    {folder.name} ({folderDiscs.length})
                  </button>
                  {expandedFolders.has(folder.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {folderDiscs.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                          No discs
                        </div>
                      ) : (
                        folderDiscs.map(renderDiscItem)
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* View Mode Toggle */}
          {currentDisc && location.pathname !== '/disc-list' && (
            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                View Mode
              </h3>
              <div className="space-y-1">
                {viewModes.map((mode) => {
                  const Icon = mode.icon
                  return (
                    <Button
                      key={mode.id}
                      variant={viewMode === mode.id ? 'primary' : 'ghost'}
                      onClick={() => setViewMode(mode.id as any)}
                      className="w-full justify-start"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {mode.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.removeItem('isLoggedIn');
                navigate('/');
              }}
              className="w-full justify-start text-red-600 hover:text-red-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      {/* ConfirmDialog for disc deletion */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        title="Delete Disc"
        message="Are you sure you want to delete this disc? This action cannot be undone and all its data will be lost."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDangerous
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ open: false, discId: null })}
      />
    </>
  )
}
