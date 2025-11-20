export type TimeUnit = 'month' | 'week' | 'day' | 'quarter'
export type ViewMode = 'disc' | 'calendar' | 'list'
export type RingType = 'normal' | 'thin'
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Label {
  id: string
  name: string
  color: string // hex
}

export interface Attachment {
  id: string
  name: string
  url: string
}

export interface Recurrence {
  rule: RecurrenceRule
  interval?: number
  count?: number
  until?: string // ISO date
}

export interface Activity {
  id: string
  ringId: string
  title: string
  description?: string
  start: string // ISO date
  end?: string // ISO date (inclusive)
  color?: string
  labelIds?: string[]
  attachments?: Attachment[]
  recurrence?: Recurrence
}

export interface Ring {
  id: string
  name: string
  type: RingType
  color?: string
  timeUnit?: TimeUnit // override disc default
  readOnly?: boolean // for shared/locked rings
  activities?: Activity[]
}

export interface DiscTheme {
  primary: string
  accent: string
  bg: string
}

export interface ColorPalette {
  id: string
  name: string
  baseColor: string
  colors: string[] // Array of color variations (lighter to darker)
  description?: string
}

export interface Folder {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Disc {
  id: string
  name: string
  start: string // ISO date (e.g., 2025-01-01)
  end: string // ISO date (e.g., 2025-12-31)
  defaultTimeUnit: TimeUnit
  rings: Ring[]
  labels: Label[]
  theme?: DiscTheme
  colorPaletteId?: string // Reference to the chosen color palette
  folderId?: string // Optional reference to parent folder
  version: number
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  ringIds: string[]
  labelIds: string[]
  textSearch: string
  dateRange?: {
    start: string
    end: string
  }
  ringOrder?: string[] // Store the custom order of rings
}

export interface UIState {
  viewMode: ViewMode
  filters: FilterState
  selectedActivityId?: string
  isActivityDrawerOpen: boolean
  isRingDrawerOpen: boolean
  isLabelDrawerOpen: boolean
  isFilterDrawerOpen: boolean
  theme: 'light' | 'dark'
}

export interface DiscState {
  currentDisc?: Disc
  discs: Disc[]
  folders: Folder[]
  isLoading: boolean
  error?: string
}

export interface HistoryState {
  past: Disc[]
  future: Disc[]
  canUndo: boolean
  canRedo: boolean
}

// Utility types for rendering
export interface PolarPoint {
  angle: number // in radians
  radius: number
  x: number
  y: number
}

export interface ArcSegment {
  startAngle: number
  endAngle: number
  innerRadius: number
  outerRadius: number
}

export interface ActivityRenderData extends Activity {
  arcSegment: ArcSegment
  isVisible: boolean
  isSelected: boolean
}

export interface RingRenderData extends Ring {
  innerRadius: number
  outerRadius: number
  activities: ActivityRenderData[]
}

// Repository interfaces
export interface DiscRepository {
  getAll(): Promise<Disc[]>
  getById(id: string): Promise<Disc | null>
  save(disc: Disc): Promise<void>
  delete(id: string): Promise<void>
}

// Form validation schemas
export interface ActivityFormData {
  title: string
  description?: string
  start: string
  end?: string
  color?: string
  labelIds?: string[]
  recurrence?: Recurrence
}

export interface RingFormData {
  name: string
  type: RingType
  color?: string
  timeUnit?: TimeUnit
}

export interface DiscFormData {
  name: string
  start: string
  end: string
  defaultTimeUnit: TimeUnit
  theme?: DiscTheme
}

export interface LabelFormData {
  name: string
  color: string
}
