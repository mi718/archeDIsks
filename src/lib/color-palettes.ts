import type { ColorPalette } from '@/types'

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'meadow',
    name: 'Meadow',
    baseColor: '#A8D5A4',
    colors: [
      '#F4F6A8', // Light yellow
      '#A8D5A4', // Light green
      '#5F8D5A', // Medium green
      '#3D5C3A', // Dark green
      '#2C4A3A', // Darker teal-green
    ],
    description: 'Fresh and natural greens'
  },
  {
    id: 'candy',
    name: 'Candy',
    baseColor: '#9B7FD6',
    colors: [
      '#7DDDC9', // Mint
      '#9B7FD6', // Lavender
      '#6B8FE8', // Blue
      '#8AB8E8', // Light blue
      '#F5A2C4', // Pink
    ],
    description: 'Sweet and playful pastels'
  },
  {
    id: 'tropical',
    name: 'Tropical',
    baseColor: '#17A697',
    colors: [
      '#17A697', // Teal
      '#15766E', // Dark teal
      '#FF8B5C', // Coral
      '#FFC947', // Golden yellow
      '#15766E', // Deep teal
    ],
    description: 'Vibrant tropical colors'
  },
  {
    id: 'botanical',
    name: 'Botanical',
    baseColor: '#D0D9A0',
    colors: [
      '#D0D9A0', // Pale yellow-green
      '#E0A8CF', // Mauve
      '#C17A9E', // Rose
      '#6B5053', // Dark brown
      '#3C3033', // Charcoal
    ],
    description: 'Elegant botanical tones'
  }
]

export const getColorPaletteById = (id: string): ColorPalette | undefined => {
  return COLOR_PALETTES.find(palette => palette.id === id)
}

export const getRandomColorFromPalette = (paletteId: string): string => {
  const palette = getColorPaletteById(paletteId)
  if (!palette) return '#3B82F6' // default blue
  
  // Return a random color from all 5 colors
  return palette.colors[Math.floor(Math.random() * palette.colors.length)]
}

export const getColorVariation = (paletteId: string, index: number): string => {
  const palette = getColorPaletteById(paletteId)
  if (!palette) return '#3B82F6'
  
  // Ensure index is within bounds
  const safeIndex = Math.min(Math.max(0, index), palette.colors.length - 1)
  return palette.colors[safeIndex]
}

// Helper function to lighten a hex color
const lightenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent)))
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + ((255 - ((num >> 8) & 0x00FF)) * percent)))
  const b = Math.min(255, Math.floor((num & 0x0000FF) + ((255 - (num & 0x0000FF)) * percent)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// Helper function to darken a hex color
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)))
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)))
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// Get all available colors for a palette including lighter and darker variations
export const getPaletteColors = (paletteId: string): string[] => {
  const palette = getColorPaletteById(paletteId)
  if (!palette) return ['#3B82F6']
  
  const colors: string[] = []
  
  // For each color in the palette, add lighter and darker variations
  palette.colors.forEach(color => {
    colors.push(lightenColor(color, 0.3)) // Lighter
    colors.push(lightenColor(color, 0.15)) // Slightly lighter
    colors.push(color) // Original
    colors.push(darkenColor(color, 0.15)) // Slightly darker
    colors.push(darkenColor(color, 0.3)) // Darker
  })
  
  return colors
}
