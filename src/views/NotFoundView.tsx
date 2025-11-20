import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const NotFoundView = () => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <Home className="h-12 w-12 text-gray-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          404
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Page not found
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
          <Button
            onClick={() => navigate('/disc-list')}
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
