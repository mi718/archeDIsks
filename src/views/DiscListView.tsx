import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Tag, Trash2, Circle, Folder, ChevronDown, ChevronRight, FolderX, Share2, Mail, Copy, Check, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDiscStore } from '@/stores/disc-store'
import { useNotificationStore } from '@/stores/notification-store'
import { useUIStore } from '@/stores/ui-store'
import { formatDate } from '@/lib/date-utils'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/FormElements'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { COLOR_PALETTES } from '@/lib/color-palettes'
import { useAuthStore } from '@/stores/auth-store'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect } from 'react'

export const DiscListView = () => {
  const navigate = useNavigate()
  const { discs, folders, isLoading, error, deleteDisc, createFolder, moveDiscToFolder, deleteFolder, shareFolder, joinFolder, loadDiscs } = useDiscStore()
  // User name map for UID -> name
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({})

  // Fetch user names for all UIDs in sharedWith and ownerId using UID as doc ID
  useEffect(() => {
    const fetchUserNames = async () => {
      // Collect all unique UIDs from sharedWith and ownerId of all folders
      const allUids = Array.from(new Set(folders.flatMap(f => [f.ownerId, ...f.sharedWith])));
      if (allUids.length === 0) return;
      const missingUids = allUids.filter(uid => !userNameMap[uid]);
      if (missingUids.length === 0) return;
      let newMap: Record<string, string> = {};
      await Promise.all(missingUids.map(async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data && data.name) newMap[uid] = data.name;
          }
        } catch (e) {
          // ignore errors for missing users
        }
      }));
      if (Object.keys(newMap).length > 0) {
        setUserNameMap(prev => ({ ...prev, ...newMap }));
      }
    };
    fetchUserNames();
    // Only rerun if folders or userNameMap changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders]);
  const [isCreating, setIsCreating] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    startMonth: new Date().getMonth(),
    startYear: new Date().getFullYear(),
    duration: 'yearly' as 'yearly' | 'quarterly' | 'monthly',
    colorPaletteId: 'meadow',
    defaultTimeUnit: 'month' as const
  })
  const [formErrors, setFormErrors] = useState({
    name: '',
    startMonth: '',
    startYear: '',
    defaultTimeUnit: ''
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
  // Track which folder's user list is open
  const [showUsersByFolderId, setShowUsersByFolderId] = useState<Record<string, boolean>>({})
  const [draggedDiscId, setDraggedDiscId] = useState<string | null>(null)
  const filters = useUIStore((state) => state.filters);
    // Fetch discs from Firestore when filters change
    useEffect(() => {
      // Only fetch from Firestore if user is authenticated
      // and filters are set (textSearch, ringIds, labelIds, dateRange)
      // Otherwise, fallback to default loadDiscs
      const fetchFilteredDiscs = async () => {
        const { textSearch, ringIds, labelIds, dateRange } = filters;
        if (!textSearch && (!ringIds || ringIds.length === 0) && (!labelIds || labelIds.length === 0) && !dateRange) {
          await loadDiscs();
          return;
        }
        // Build Firestore query
        let conditions: any[] = [];
        if (dateRange) {
          conditions.push(where('start', '>=', dateRange.start));
          conditions.push(where('end', '<=', dateRange.end));
        }
        let queryRef = collection(db, 'discs');
        if (conditions.length > 0) {
          queryRef = query(collection(db, 'discs'), ...conditions);
        }
        const snapshot = await getDocs(queryRef);
        let filteredDiscs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as import('@/types').Disc[];
        // Apply client-side filters for textSearch, ringIds, labelIds
        if (textSearch) {
          filteredDiscs = filteredDiscs.filter(disc => disc.name && disc.name.toLowerCase().includes(textSearch.toLowerCase()));
        }
        if (ringIds && ringIds.length > 0) {
          filteredDiscs = filteredDiscs.filter(disc => disc.rings && disc.rings.some((ring: any) => ringIds.includes(ring.id)));
        }
        if (labelIds && labelIds.length > 0) {
          filteredDiscs = filteredDiscs.filter(disc => disc.labels && disc.labels.some((label: any) => labelIds.includes(label.id)));
        }
        useDiscStore.setState({ discs: filteredDiscs });
      };
      fetchFilteredDiscs();
    }, [filters]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [discToDelete, setDiscToDelete] = useState<string | null>(null);
  const [folderDeleteConfirmOpen, setFolderDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Sharing states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [sharingFolderId, setSharingFolderId] = useState<string | null>(null)
  const [shareExpiration, setShareExpiration] = useState('24') // hours
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  // Email invitation states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [senderEmail, setSenderEmail] = useState('')
  const [recipientEmails, setRecipientEmails] = useState<string[]>([''])
  const [isSendingInvitations, setIsSendingInvitations] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Join folder states
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [recentEmails, setRecentEmails] = useState<string[]>(() => {
    const saved = localStorage.getItem('archedisks_recent_emails')
    return saved ? JSON.parse(saved) : []
  })
  const [recentCodes, setRecentCodes] = useState<string[]>(() => {
    const saved = localStorage.getItem('archedisks_recent_codes')
    return saved ? JSON.parse(saved) : []
  })

  const saveRecentCode = (code: string) => {
    if (!code) return
    const newRecentCodes = [code, ...recentCodes.filter(c => c !== code)].slice(0, 4)
    setRecentCodes(newRecentCodes)
    localStorage.setItem('archedisks_recent_codes', JSON.stringify(newRecentCodes))
  }

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
      startYear: new Date().getFullYear(),
      duration: 'yearly',
      colorPaletteId: 'meadow',
      defaultTimeUnit: 'month'
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
    if (!draggedDiscId) return;
    const targetFolder = folders.find(f => f.id === folderId);
    const disc = discs.find(d => d.id === draggedDiscId);
    const currentUserUid = useAuthStore.getState().user?.uid;
    // If disc is being moved out of its current folder, only owner of source folder can do it
    if (disc && disc.folderId && disc.folderId !== folderId) {
      const sourceFolder = folders.find(f => f.id === disc.folderId);
      if (sourceFolder && sourceFolder.ownerId !== currentUserUid) {
        useNotificationStore.getState().addNotification('Only the owner can move discs out of a folder.', 'error', 5000);
        setDraggedDiscId(null);
        return;
      }
    }
    // Optionally, keep the previous restriction for shared folders (moving in)
    if (targetFolder && targetFolder.sharedWith.length > 1 && targetFolder.ownerId !== currentUserUid) {
      useNotificationStore.getState().addNotification('Only the owner can move discs in or out of shared folders.', 'error', 5000);
      setDraggedDiscId(null);
      return;
    }
    await moveDiscToFolder(draggedDiscId, folderId);
    setDraggedDiscId(null);
  }

  const handleDropOnRoot = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedDiscId) return;
    // Only the owner can move discs out of any folder
    const disc = discs.find(d => d.id === draggedDiscId);
    if (disc && disc.folderId) {
      const folder = folders.find(f => f.id === disc.folderId);
      const currentUserUid = useAuthStore.getState().user?.uid;
      if (folder && folder.ownerId !== currentUserUid) {
        useNotificationStore.getState().addNotification('Only the owner can move discs out of a folder.', 'error', 5000);
        setDraggedDiscId(null);
        return;
      }
    }
    await moveDiscToFolder(draggedDiscId, null);
    setDraggedDiscId(null);
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

  const handleShareFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    // Ensure folderId is valid and exists in folders
    const folderExists = folders.some(f => f.id === folderId)
    if (!folderId || !folderExists) {
      // Optionally, show a notification or error here
      return
    }
    setSharingFolderId(folderId)
    setGeneratedCode(null)
    setIsCopied(false)
    setSenderEmail('')
    setRecipientEmails([''])
    setIsShareModalOpen(true)
  }

  const notify = useNotificationStore((state) => state.error)
  const generateCode = async () => {
    if (!sharingFolderId) return
    try {
      const code = await shareFolder(sharingFolderId, parseInt(shareExpiration))
      setGeneratedCode(code)
      if (code) {
        saveRecentCode(code)
      }
    } catch (error) {
      console.error('Failed to generate share code:', error)
      notify('Failed to generate share code. Please try again.')
    }
  }

  const copyToClipboard = () => {
    if (!generatedCode) return
    navigator.clipboard.writeText(generatedCode)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleSendInvitations = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingInvitations(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const folder = folders.find(f => f.id === sharingFolderId)
    const filteredRecipientEmails = recipientEmails.filter(email => email.trim() !== '')
    console.log(`Sending invitations for folder "${folder?.name}" from ${senderEmail} to: ${filteredRecipientEmails.join(', ')}`)
    
    // Save latest 4 unique emails
    const newRecentEmails = [...recentEmails]
    filteredRecipientEmails.forEach(email => {
      const trimmedEmail = email.trim()
      if (trimmedEmail && !newRecentEmails.includes(trimmedEmail)) {
        newRecentEmails.unshift(trimmedEmail)
      } else if (trimmedEmail && newRecentEmails.includes(trimmedEmail)) {
        // Move to front if already exists
        const index = newRecentEmails.indexOf(trimmedEmail)
        newRecentEmails.splice(index, 1)
        newRecentEmails.unshift(trimmedEmail)
      }
    })
    
    const updatedRecentEmails = newRecentEmails.slice(0, 4)
    setRecentEmails(updatedRecentEmails)
    localStorage.setItem('archedisks_recent_emails', JSON.stringify(updatedRecentEmails))

    setIsSendingInvitations(false)
    setIsEmailModalOpen(false)
    setIsShareModalOpen(false)
    setSuccessMessage('Invitations sent successfully!')
    setIsSuccessModalOpen(true)
  }

  const handleAddRecipient = () => {
    setRecipientEmails([...recipientEmails, ''])
  }

  const handleRecipientChange = (index: number, value: string) => {
    const newEmails = [...recipientEmails]
    newEmails[index] = value
    setRecipientEmails(newEmails)
  }

  const handleRemoveRecipient = (index: number) => {
    if (recipientEmails.length > 1) {
      setRecipientEmails(recipientEmails.filter((_, i) => i !== index))
    }
  }

  const sendEmail = () => {
    if (!generatedCode) return
    setIsEmailModalOpen(true)
  }

  const handleJoinFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    
    if (!joinCode.trim()) {
      setJoinError('Please enter a share code')
      return
    }

    try {
      const folder = await joinFolder(joinCode.trim())
      saveRecentCode(joinCode.trim())
      // Add folder to expanded set to show it
      const newExpanded = new Set(expandedFolders)
      newExpanded.add(folder.id)
      setExpandedFolders(newExpanded)
      
      setIsJoinModalOpen(false)
      setJoinCode('')
      setSuccessMessage(`Successfully joined folder: ${folder.name}`)
      setIsSuccessModalOpen(true)
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join folder')
    }
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
    if (duration === 'monthly' && (defaultTimeUnit === 'month' || defaultTimeUnit === 'quarter')) {
      defaultTimeUnit = 'week' as typeof formData.defaultTimeUnit;
    }
    setFormData({ ...formData, duration, defaultTimeUnit });
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, startYear: parseInt(e.target.value) || new Date().getFullYear() });
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
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
      }

      const endDay = new Date(endYear, endMonth + 1, 0).getDate(); // Last day of the end month

      const newDisc = await useDiscStore.getState().createDisc({
        name: formData.name,
        start: new Date(startYear, selectedMonth, 1).toISOString(),
        end: new Date(endYear, endMonth, endDay).toISOString(),
        defaultTimeUnit: formData.defaultTimeUnit,
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

  const handleTimeUnitChange = (value: string) => {
    setFormData({ ...formData, defaultTimeUnit: value as typeof formData.defaultTimeUnit });
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
          <Button
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center space-x-2"
            variant="outline"
          >
            <Share2 className="h-4 w-4" />
            <span>Join Folder</span>
          </Button>
        </div>
      </div>

        {/* New Disc Modal */}
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
              onChange={handleTimeUnitChange}
              required
            />
            
            {/* Color Palette Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Color Palette
              </label>
              <div className="grid grid-cols-2 gap-3">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, colorPaletteId: palette.id })}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.colorPaletteId === palette.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-5 h-5 rounded-full shadow-sm"
                        style={{ backgroundColor: palette.baseColor }}
                      />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {palette.name}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-1.5">
                      {palette.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {palette.description && (
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                        {palette.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isCreating}
                className="w-full py-2.5 text-base font-semibold"
              >
                {isCreating ? 'Creating...' : 'Create Disk'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Success Modal */}
        <Modal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          title=""
        >
          <div className="py-2 flex flex-col items-center text-center">
            <div className="mb-4 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Check className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {successMessage}
            </p>
            <div className="flex justify-end w-full border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
            </div>
          </div>
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

        {/* Share Folder Modal */}
        {isShareModalOpen && sharingFolderId && (
          <Modal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            title="Share Folder"
          >
            <div className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate a secure code to invite others to collaborate on this folder.
              </p>

              {!generatedCode ? (
                <div className="space-y-4">
                  <Select
                    label="Code Expiration"
                    options={[
                      { value: '1', label: '1 Hour' },
                      { value: '24', label: '1 Day' },
                      { value: '72', label: '3 Days' },
                      { value: '168', label: '7 Days' }
                    ]}
                    value={shareExpiration}
                    onChange={setShareExpiration}
                  />
                  <Button onClick={generateCode} className="w-full">
                    Generate Share Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Share Code
                    </label>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-2xl font-mono font-bold tracking-widest text-primary-600 dark:text-primary-400">
                        {generatedCode}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex-shrink-0"
                      >
                        {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Expires on {new Date(folders.find(f => f.id === sharingFolderId)?.shareExpiresAt || '').toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button onClick={sendEmail} variant="secondary" className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Send via Email</span>
                    </Button>
                    <Button onClick={() => setGeneratedCode(null)} variant="ghost" className="text-sm">
                      Generate New Code
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button onClick={() => setIsShareModalOpen(false)} variant="outline" className="w-full">
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Email Invitation Modal */}
        <Modal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          title="Send Invitations"
        >
          <form onSubmit={handleSendInvitations} className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Send an invitation to collaborate on folder <span className="font-semibold text-gray-900 dark:text-white">"{folders.find(f => f.id === sharingFolderId)?.name}"</span>.
            </p>

            <Input
              label="Your Email"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              required
            />

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Recipient Emails
              </label>
              <datalist id="recent-emails">
                {recentEmails.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
              {recipientEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label=""
                      type="email"
                      value={email}
                      onChange={(e) => handleRecipientChange(index, e.target.value)}
                      required
                      list="recent-emails"
                    />
                  </div>
                  {recipientEmails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipient(index)}
                      className="mt-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRecipient}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another recipient
              </Button>
            </div>

            <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30">
              <p className="text-xs text-primary-800 dark:text-primary-300">
                <strong>Invitation Message:</strong><br />
                Hi, you have been invited to collaborate on a shared folder in ArcheDisk. Use the code: <strong>{generatedCode}</strong> to join.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEmailModalOpen(false)}
                className="flex-1"
                disabled={isSendingInvitations}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSendingInvitations}
              >
                {isSendingInvitations ? 'Sending...' : 'Send Invitations'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Join Folder Modal */}
        <Modal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          title="Join Shared Folder"
        >
          <form onSubmit={handleJoinFolder} className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the 8-14 character share code you received to gain access to a shared folder.
            </p>

            <datalist id="recent-codes">
              {recentCodes.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>

            <Input
              label="Share Code"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.slice(0, 14))
                setJoinError('')
              }}
              error={joinError}
              list="recent-codes"
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsJoinModalOpen(false)
                  setJoinCode('')
                  setJoinError('')
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Join Folder
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
            const showUsers = showUsersByFolderId[folder.id] || false;
            const currentUserUid = useAuthStore.getState().user?.uid;
            const isOwner = folder.ownerId === currentUserUid;
            const toggleShowUsers = (e: React.MouseEvent) => {
              e.stopPropagation();
              setShowUsersByFolderId(prev => ({ ...prev, [folder.id]: !prev[folder.id] }));
            };
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
                    {/* User dropdown removed */}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleShareFolder(e, folder.id)}
                      className="p-1 text-primary-600 hover:text-primary-700"
                      title="Share Folder"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleFolderDelete(e, folder.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Delete Folder"
                      disabled={!isOwner}
                    >
                      <FolderX className="h-4 w-4" />
                    </Button>
                    {!isOwner && Array.isArray(folder.sharedWith) && currentUserUid && folder.sharedWith.includes(currentUserUid) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => { e.stopPropagation(); useDiscStore.getState().leaveFolder(folder.id); }}
                        className="p-1 text-yellow-600 hover:text-yellow-700"
                        title="Leave Folder"
                      >
                        Leave
                      </Button>
                    )}
                  </div>
                </div>
                {/* User dropdown and list removed */}

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
