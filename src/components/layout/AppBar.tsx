import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Menu, 
  Download, 
  Upload, 
  Moon, 
  Sun,
  Filter,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUIStore } from '@/stores/ui-store'
import { useDiscStore } from '@/stores/disc-store'
import { exportToPNG, exportToPDF, exportToJSON } from '@/lib/export-utils'

interface AppBarProps {
  onMenuToggle: () => void
  isMenuOpen: boolean
}

export const AppBar = ({ onMenuToggle, isMenuOpen }: AppBarProps) => {
  const navigate = useNavigate()
  const { theme, toggleTheme, setTextSearch, openFilterDrawer } = useUIStore()
  const { exportDiscs, importDiscs, currentDisc } = useDiscStore()
  const [isImporting, setIsImporting] = useState(false)

  const getExportFileName = (extension: string) => {
    const baseName = currentDisc ? currentDisc.name : 'orbitaldisk-export'
    return `${baseName}_orbitalDisk.${extension}`
  }

  const handleExportJSON = async () => {
    try {
      const data = await exportDiscs()
      exportToJSON(JSON.parse(data), getExportFileName('json'))
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleExportPNG = async () => {
    try {
      const discElement = document.querySelector('[data-disc-view]') as HTMLElement
      if (discElement) {
        await exportToPNG(discElement, getExportFileName('png'))
      }
    } catch (error) {
      console.error('PNG export failed:', error)
    }
  }

  const handleExportPDF = async () => {
    try {
      const discElement = document.querySelector('[data-disc-view]') as HTMLElement
      if (discElement) {
        await exportToPDF(discElement, getExportFileName('pdf'))
      }
    } catch (error) {
      console.error('PDF export failed:', error)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      await importDiscs(text)
      // Clear the input so the same file can be imported again
      event.target.value = ''
      navigate('/disc-list')
    } catch (error) {
      console.error('Import failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to import discs'
      alert(`Import Error: ${errorMessage}`)
      // Clear the input
      event.target.value = ''
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className={`p-2 ${isMenuOpen ? 'hidden' : 'flex'} lg:${isMenuOpen ? 'hidden' : 'flex'}`}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            OrbitalDisk
          </h1>
        </div>

        <div className="hidden lg:flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64"
              onChange={(e) => setTextSearch(e.target.value)}
            />
          </div>

          {/* Filter */}
          <Button
            variant="outline"
            size="sm"
            onClick={openFilterDrawer}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <button
                    onClick={handleExportJSON}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={handleExportPNG}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export PNG
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
                disabled={isImporting}
              >
                <Upload className="h-4 w-4" />
                <span>{isImporting ? 'Importing...' : 'Import'}</span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
