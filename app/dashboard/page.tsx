import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user, leads, payments, userBadges } from "@/lib/db/schema"
import { eq, and, count, sum } from "drizzle-orm"

const STEPS = ["A", "B", "C", "D", "E"] as const
const STEP_LABELS: Record<string, string> = {
  A: "Prospection",
  B: "Qualification",
  C: "Proposition",
  D: "Negociation",
  E: "Cloture",
}

const GRADE_THRESHOLDS = [
  { grade: "STARTER", min: 0, max: 5 },
  { grade: "SILVER", min: 5, max: 15 },
  { grade: "GOLD", min: 15, max: 30 },
  { grade: "PLATINUM", min: 30, max: 50 },
  { grade: "DIAMOND", min: 50, max: 100 },
]

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const userId = session.user.id

  // Fetch user grade
  const [dbUser] = await db
    .select({ grade: user.grade })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  // KPIs
  const [leadCount] = await db
    .select({ value: count() })
    .from(leads)
    .where(eq(leads.affiliateId, userId))

  const [dealsWon] = await db
    .select({ value: count() })
    .from(leads)
    .where(and(eq(leads.affiliateId, userId), eq(leads.step, "E")))

  const [totalCommission] = await db
    .select({ value: sum(payments.commissionAmount) })
    .from(payments)
    .where(and(eq(payments.affiliateId, userId), eq(payments.status, "PAID")))

  const [badgeCount] = await db
    .select({ value: count() })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))

  // Pipeline counts
  const pipelineCounts = await db
    .select({ step: leads.step, value: count() })
    .from(leads)
    .where(and(eq(leads.affiliateId, userId), eq(leads.status, "ACTIVE")))
    .groupBy(leads.step)

  const stepCountMap: Record<string, number> = {}
  for (const row of pipelineCounts) {
    stepCountMap[row.step] = row.value
  }

  // Grade progress
  const currentGrade = dbUser?.grade ?? "STARTER"
  const threshold = GRADE_THRESHOLDS.find((t) => t.grade === currentGrade) ?? GRADE_THRESHOLDS[0]
  const totalDeals = dealsWon?.value ?? 0
  const progress = threshold.max > 0 ? Math.min(100, Math.round((totalDeals / threshold.max) * 100)) : 0

  const kpis = [
    { label: "Leads", value: leadCount?.value ?? 0 },
    { label: "Deals conclus", value: dealsWon?.value ?? 0 },
    { label: "Commissions", value: `${Number(totalCommission?.value ?? 0).toFixed(0)} EUR` },
    { label: "Badges", value: badgeCount?.value ?? 0 },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Vue d&apos;ensemble</h1>

      {/* Grade Progress */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Progression {currentGrade}</span>
          <span className="text-xs text-neutral-500">{totalDeals} / {threshold.max} deals</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-100">
          <div
            className="h-2 rounded-full bg-black transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {/* Mini Pipeline */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <Link
            href="/dashboard/leads"
            className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Voir tout
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {STEPS.map((step) => (
            <div
              key={step}
              className="rounded-xl bg-neutral-50 p-3 text-center"
            >
              <p className="text-lg font-bold">{stepCountMap[step] ?? 0}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                {STEP_LABELS[step]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
