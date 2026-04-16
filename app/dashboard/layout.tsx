import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Network,
  Award,
  Wallet,
  UserCircle,
  Target,
} from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { LogoutButton } from "@/components/logout-button"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Mes leads", icon: Target },
  { href: "/dashboard/network", label: "Mon réseau", icon: Network },
  { href: "/dashboard/badges", label: "Mes badges", icon: Award },
  { href: "/dashboard/finances", label: "Finances", icon: Wallet },
  { href: "/dashboard/profile", label: "Profil", icon: UserCircle },
]

const GRADE_COLORS: Record<string, string> = {
  STARTER: "bg-neutral-100 text-neutral-700",
  SILVER: "bg-neutral-200 text-neutral-800",
  GOLD: "bg-amber-100 text-amber-800",
  PLATINUM: "bg-indigo-100 text-indigo-800",
  DIAMOND: "bg-purple-100 text-purple-800",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [dbUser] = await db
    .select({
      role: user.role,
      grade: user.grade,
      parrainageCode: user.parrainageCode,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!dbUser) redirect("/auth/login")
  if (dbUser.role !== "affiliate" && dbUser.role !== "admin") redirect("/auth/login")

  const displayName = dbUser.firstName
    ? `${dbUser.firstName} ${dbUser.lastName ?? ""}`.trim()
    : dbUser.name

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
            <p className="text-[10px] text-neutral-500">Affilie</p>
          </div>
        </div>

        {/* Grade badge */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${GRADE_COLORS[dbUser.grade] ?? GRADE_COLORS.STARTER}`}
          >
            {dbUser.grade}
          </span>
        </div>

        {/* Parrainage code */}
        {dbUser.parrainageCode && (
          <div className="mb-5 rounded-lg bg-neutral-50 px-3 py-2 text-xs">
            <span className="text-neutral-500">Code : </span>
            <span className="font-mono font-semibold">{dbUser.parrainageCode}</span>
          </div>
        )}

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
          <p className="truncate text-xs font-medium text-neutral-700">{displayName}</p>
          <p className="truncate text-[10px] text-neutral-400">{session.user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
