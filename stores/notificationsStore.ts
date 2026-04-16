import { create } from "zustand"

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link: string | null
  createdAt: string
}

interface NotificationsState {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  setNotifications: (notifications: NotificationItem[]) => void
  setUnreadCount: (count: number) => void
  setLoading: (loading: boolean) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: NotificationItem) => void
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (isLoading) => set({ isLoading }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    })),
}))
