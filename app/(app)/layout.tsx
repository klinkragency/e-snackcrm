import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Users, Settings, LayoutDashboard } from "lucide-react"
import { auth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
        {/* Sidebar */}
        <aside className="flex w-56 shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <Link href="/clients" className="mb-6 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Klinkragency</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-neutral-500">Dashboard</p>
            </div>
          </Link>

          <nav className="flex flex-col gap-1">
            <Link
              href="/clients"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              <Users size={16} />
              Clients
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              <Settings size={16} />
              Réglages
            </Link>
          </nav>

          <div className="mt-auto border-t border-neutral-100 pt-4">
            <p className="truncate px-2 text-xs text-neutral-500">{session.user.email}</p>
            <LogoutButton />
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
