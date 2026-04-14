"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/auth/client"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
    >
      <LogOut size={13} />
      Se déconnecter
    </button>
  )
}
