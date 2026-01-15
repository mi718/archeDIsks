import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { UIState, ViewMode, FilterState } from '@/types'

interface UIStore extends UIState {
  // View actions
  setViewMode: (mode: ViewMode) => void

  // Filter actions
  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
  toggleRingFilter: (ringId: string) => void
  toggleLabelFilter: (labelId: string) => void
  setTextSearch: (text: string) => void
  setDateRange: (start: string, end: string) => void
  setRingOrder: (ringOrder: string[]) => void

  // Drawer actions
  openActivityDrawer: (activityId?: string) => void
  closeActivityDrawer: () => void
  openRingDrawer: (ringId?: string) => void
  closeRingDrawer: () => void
  openLabelDrawer: () => void
  closeLabelDrawer: () => void
  openFilterDrawer: () => void
  closeFilterDrawer: () => void

  // Theme actions
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void

  // Utility actions
  reset: () => void
}

const defaultFilters: FilterState = {
  ringIds: [],
  labelIds: [],
  textSearch: '',
  dateRange: undefined,
  ringOrder: []
}

const defaultUIState: UIState = {
  viewMode: 'disc',
  filters: defaultFilters,
  selectedActivityId: undefined,
  isActivityDrawerOpen: false,
  isRingDrawerOpen: false,
  selectedRingId: undefined,
  isLabelDrawerOpen: false,
  isFilterDrawerOpen: false,
  theme: (localStorage.getItem('archedisks_theme') as 'light' | 'dark') || 'light'
}

export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set, get) => ({
    ...defaultUIState,

    // View actions
    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode })
    },

    // Filter actions
    setFilters: (filters: Partial<FilterState>) => {
      const currentFilters = get().filters
      set({ 
        filters: { ...currentFilters, ...filters }
      })
    },

    clearFilters: () => {
      set({ filters: defaultFilters })
    },

    toggleRingFilter: (ringId: string) => {
      const { filters } = get()
      const ringIds = filters.ringIds.includes(ringId)
        ? filters.ringIds.filter(id => id !== ringId)
        : [...filters.ringIds, ringId]

      set({ 
        filters: { ...filters, ringIds }
      })
    },

    toggleLabelFilter: (labelId: string) => {
      const { filters } = get()
      const labelIds = filters.labelIds.includes(labelId)
        ? filters.labelIds.filter(id => id !== labelId)
        : [...filters.labelIds, labelId]

      set({ 
        filters: { ...filters, labelIds }
      })
    },

    setTextSearch: (text: string) => {
      set({ 
        filters: { ...get().filters, textSearch: text }
      })
    },

    setDateRange: (start: string, end: string) => {
      set({ 
        filters: { 
          ...get().filters, 
          dateRange: { start, end }
        }
      })
    },

    setRingOrder: (ringOrder: string[]) => {
      set({
        filters: {
          ...get().filters,
          ringOrder
        }
      })
    },

    // Drawer actions
    openActivityDrawer: (activityId?: string) => {
      set({ 
        isActivityDrawerOpen: true,
        selectedActivityId: activityId
      })
    },

    closeActivityDrawer: () => {
      set({ 
        isActivityDrawerOpen: false,
        selectedActivityId: undefined
      })
    },

    openRingDrawer: (ringId?: string) => {
      set({ 
        isRingDrawerOpen: true,
        selectedRingId: ringId
      })
    },

    closeRingDrawer: () => {
      set({ 
        isRingDrawerOpen: false,
        selectedRingId: undefined
      })
    },

    openLabelDrawer: () => {
      set({ isLabelDrawerOpen: true })
    },

    closeLabelDrawer: () => {
      set({ isLabelDrawerOpen: false })
    },

    openFilterDrawer: () => {
      set({ isFilterDrawerOpen: true })
    },

    closeFilterDrawer: () => {
      set({ isFilterDrawerOpen: false })
    },

    // Theme actions
    toggleTheme: () => {
      const currentTheme = get().theme
      const newTheme = currentTheme === 'light' ? 'dark' : 'light'
      set({ theme: newTheme })

      // Apply theme to document
      document.documentElement.classList.toggle('dark', newTheme === 'dark')

      // Save to localStorage
      localStorage.setItem('archedisks_theme', newTheme)
    },

    setTheme: (theme: 'light' | 'dark') => {
      set({ theme })

      // Apply theme to document
      document.documentElement.classList.toggle('dark', theme === 'dark')

      // Save to localStorage
      localStorage.setItem('archedisks_theme', theme)
    },

    // Utility actions
    reset: () => {
      set(defaultUIState)
    }
  }))
)

// Initialize theme from localStorage
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('archedisks_theme') as 'light' | 'dark' | null
  if (savedTheme) {
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }
}
