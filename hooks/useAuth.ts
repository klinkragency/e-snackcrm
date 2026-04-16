"use client"

import { useEffect } from "react"
import { useSession } from "@/lib/auth/client"
import { useAuthStore, type AuthUser } from "@/stores/authStore"
import type { Role, Grade } from "@/types"

/**
 * Hook that syncs Better Auth's useSession with the Zustand auth store.
 * Returns the auth store state for use in components.
 */
export function useAuth() {
  const { data: session, isPending } = useSession()
  const { user, isLoading, setUser, setLoading, clear } = useAuthStore()

  useEffect(() => {
    if (isPending) {
      setLoading(true)
      return
    }

    if (!session?.user) {
      clear()
      return
    }

    const sessionUser = session.user as {
      id: string
      name: string
      email: string
      role?: string
      firstName?: string | null
      lastName?: string | null
      avatarUrl?: string | null
      grade?: string
      parrainageCode?: string | null
      isActive?: boolean
    }

    const authUser: AuthUser = {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      role: (sessionUser.role ?? "user") as Role,
      firstName: sessionUser.firstName ?? null,
      lastName: sessionUser.lastName ?? null,
      avatarUrl: sessionUser.avatarUrl ?? null,
      grade: (sessionUser.grade ?? "STARTER") as Grade,
      parrainageCode: sessionUser.parrainageCode ?? null,
      isActive: sessionUser.isActive ?? true,
    }

    setUser(authUser)
  }, [session, isPending, setUser, setLoading, clear])

  const isAdmin = user?.role === "admin"
  const isAffiliate = user?.role === "affiliate"
  const isAuthenticated = !!user

  return {
    user,
    isLoading: isLoading || isPending,
    isAuthenticated,
    isAdmin,
    isAffiliate,
  }
}
