import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user, leads, payments } from "@/lib/db/schema"
import { eq, count, sum, and } from "drizzle-orm"

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (dbUser?.role !== "admin") redirect("/dashboard")

  const [totalLeads] = await db.select({ value: count() }).from(leads)
  const [totalDeals] = await db
    .select({ value: count() })
    .from(leads)
    .where(eq(leads.step, "E"))

  const [totalCA] = await db
    .select({ value: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.status, "PAID"))

  const [totalCommissions] = await db
    .select({ value: sum(payments.commissionAmount) })
    .from(payments)
    .where(eq(payments.status, "PAID"))

  const [pendingCommissions] = await db
    .select({ value: sum(payments.commissionAmount) })
    .from(payments)
    .where(eq(payments.status, "PENDING"))

  const [affiliateCount] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, "affiliate"))

  const kpis = [
    { label: "Total leads", value: totalLeads?.value ?? 0 },
    { label: "Deals conclus", value: totalDeals?.value ?? 0 },
    { label: "CA encaisse", value: `${Number(totalCA?.value ?? 0).toFixed(0)} EUR` },
    { label: "Commissions versees", value: `${Number(totalCommissions?.value ?? 0).toFixed(0)} EUR` },
    { label: "Commissions en attente", value: `${Number(pendingCommissions?.value ?? 0).toFixed(0)} EUR` },
    { label: "Affilies", value: affiliateCount?.value ?? 0 },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Vue d&apos;ensemble Admin</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {kpi.label}
            </p>
            <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
