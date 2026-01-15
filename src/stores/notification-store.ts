import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

interface NotificationStore {
  notifications: Notification[]
  addNotification: (message: string, type: NotificationType, duration?: number) => void
  removeNotification: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warn: (message: string, duration?: number) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (message, type, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      notifications: [...state.notifications, { id, message, type, duration }]
    }))

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }))
      }, duration)
    }
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }))
  },
  success: (message, duration) => useNotificationStore.getState().addNotification(message, 'success', duration),
  error: (message, duration) => useNotificationStore.getState().addNotification(message, 'error', duration),
  info: (message, duration) => useNotificationStore.getState().addNotification(message, 'info', duration),
  warn: (message, duration) => useNotificationStore.getState().addNotification(message, 'warning', duration),
}))
