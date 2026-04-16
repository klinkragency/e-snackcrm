import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, and, desc, count } from "drizzle-orm"
import type { NotificationType } from "@/types"

/**
 * Create a new notification for a user.
 */
export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}): Promise<string> {
  const id = crypto.randomUUID()

  await db.insert(notifications).values({
    id,
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
    isRead: false,
  })

  return id
}

/**
 * Get notifications for a user, ordered by most recent first.
 */
export async function getNotifications(
  userId: string,
  options?: { limit?: number; offset?: number; unreadOnly?: boolean }
): Promise<{
  notifications: Array<{
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    link: string | null
    createdAt: Date
  }>
  total: number
}> {
  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  const conditions = [eq(notifications.userId, userId)]
  if (options?.unreadOnly) {
    conditions.push(eq(notifications.isRead, false))
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)!

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(notifications)
      .where(whereClause),
  ])

  return {
    notifications: rows,
    total: totalResult[0]?.count ?? 0,
  }
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )

  return result[0]?.count ?? 0
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )
}
