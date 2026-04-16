import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Kanban,
  Target,
  Users,
  CreditCard,
  Award,
  ClipboardList,
} from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { LogoutButton } from "@/components/logout-button"

const NAV_ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/admin/leads", label: "Leads", icon: Target },
  { href: "/admin/affiliates", label: "Affilies", icon: Users },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/audit", label: "Audit", icon: ClipboardList },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [dbUser] = await db
    .select({ role: user.role, name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (dbUser?.role !== "admin") redirect("/dashboard")

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-56 shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm m-3">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">e-SnackCRM</p>
            <p className="text-[10px] text-neutral-500">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="mt-auto border-t border-neutral-100 pt-3">
          <p className="truncate text-xs font-medium text-neutral-700">{dbUser.name}</p>
          <p className="truncate text-[10px] text-neutral-400">{session.user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
