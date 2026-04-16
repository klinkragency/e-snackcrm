import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)

  return NextResponse.json({ notifications: userNotifications })
}
