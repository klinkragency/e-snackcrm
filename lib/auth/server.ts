import { headers } from "next/headers"
import { auth, isSuperAdmin } from "@/lib/auth"

export type SessionUser = {
  id: string
  email: string
  name: string
  role: string
  banned?: boolean | null
}

/** Fetches the current session on the server. Null if not logged in. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return session.user as SessionUser
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  if (user.role !== "admin") throw new Error("Forbidden: admin role required")
  return user
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAdmin()
  if (!isSuperAdmin(user.email)) {
    throw new Error("Forbidden: super admin only")
  }
  return user
}

export { isSuperAdmin }
