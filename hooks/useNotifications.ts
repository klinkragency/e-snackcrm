"use client"

import { useEffect, useCallback, useRef } from "react"
import { useNotificationsStore, type NotificationItem } from "@/stores/notificationsStore"
import { useAuthStore } from "@/stores/authStore"

const POLL_INTERVAL = 30_000 // 30 seconds

/**
 * Hook that polls notifications every 30s for the current user.
 * Exposes notification state and actions from the Zustand store.
 */
export function useNotifications() {
  const { user } = useAuthStore()
  const store = useNotificationsStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      store.setLoading(true)
      const response = await fetch("/api/notifications")
      if (!response.ok) return

      const data = (await response.json()) as {
        notifications: NotificationItem[]
        unreadCount: number
      }

      store.setNotifications(data.notifications)
      store.setUnreadCount(data.unreadCount)
    } catch {
      // Silently fail — we'll retry on next poll
    } finally {
      store.setLoading(false)
    }
  }, [user?.id])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      store.markAsRead(notificationId)

      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId }),
        })
      } catch {
        // Optimistic update already applied
      }
    },
    []
  )

  const markAllAsRead = useCallback(async () => {
    store.markAllAsRead()

    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      })
    } catch {
      // Optimistic update already applied
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return

    // Initial fetch
    fetchNotifications()

    // Set up polling
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user?.id, fetchNotifications])

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}
