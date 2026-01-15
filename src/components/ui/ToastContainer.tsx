import React from 'react'
import { useNotificationStore } from '@/stores/notification-store'
import { Toast } from './Toast'

export const ToastContainer: React.FC = () => {
  const notifications = useNotificationStore((state) => state.notifications)

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
          />
        ))}
      </div>
    </div>
  )
}
