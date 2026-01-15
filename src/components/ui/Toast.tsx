import React from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle, 
  X 
} from 'lucide-react'
import type { NotificationType } from '@/stores/notification-store'
import { useNotificationStore } from '@/stores/notification-store'
import { clsx } from 'clsx'

interface ToastProps {
  id: string
  message: string
  type: NotificationType
}

export const Toast: React.FC<ToastProps> = ({ id, message, type }) => {
  const removeNotification = useNotificationStore((state) => state.removeNotification)

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/50',
    error: 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/50',
    info: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50',
    warning: 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50'
  }

  return (
    <div className={clsx(
      "flex items-center p-4 rounded-2xl shadow-lg border animate-in slide-in-from-right-full duration-300 mb-3 max-w-md w-full",
      bgColors[type]
    )}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {message}
        </p>
      </div>
      <button
        onClick={() => removeNotification(id)}
        className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
