import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Role, Grade } from "@/types"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  grade: Grade
  parrainageCode: string | null
  isActive: boolean
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  updateUser: (partial: Partial<AuthUser>) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
      clear: () => set({ user: null, isLoading: false }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({ user: state.user }),
    }
  )
)
