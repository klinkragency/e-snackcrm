import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user, leads, payments } from "@/lib/db/schema"
import { eq, count, sum, and, desc } from "drizzle-orm"

const GRADE_COLORS: Record<string, string> = {
  STARTER: "bg-neutral-100 text-neutral-700",
  SILVER: "bg-neutral-200 text-neutral-800",
  GOLD: "bg-amber-100 text-amber-800",
  PLATINUM: "bg-indigo-100 text-indigo-800",
  DIAMOND: "bg-purple-100 text-purple-800",
}

export default async function AffiliatesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (dbUser?.role !== "admin") redirect("/dashboard")

  const affiliates = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      grade: user.grade,
      isActive: user.isActive,
      parrainageCode: user.parrainageCode,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.role, "affiliate"))
    .orderBy(desc(user.createdAt))

  // Get stats per affiliate
  const stats: Record<string, { leads: number; deals: number; commission: number }> = {}
  for (const aff of affiliates) {
    const [leadCount] = await db
      .select({ value: count() })
      .from(leads)
      .where(eq(leads.affiliateId, aff.id))

    const [dealCount] = await db
      .select({ value: count() })
      .from(leads)
      .where(and(eq(leads.affiliateId, aff.id), eq(leads.step, "E")))

    const [commissionTotal] = await db
      .select({ value: sum(payments.commissionAmount) })
      .from(payments)
      .where(and(eq(payments.affiliateId, aff.id), eq(payments.status, "PAID")))

    stats[aff.id] = {
      leads: leadCount?.value ?? 0,
      deals: dealCount?.value ?? 0,
      commission: Number(commissionTotal?.value ?? 0),
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Affilies</h1>

      {affiliates.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-500">Aucun affilie inscrit.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Affilie
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Grade
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Code
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Leads
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Deals
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Commission
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Statut
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Inscrit le
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {affiliates.map((aff) => {
                const s = stats[aff.id]
                return (
                  <tr key={aff.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium">{aff.name}</p>
                      <p className="text-xs text-neutral-400">{aff.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${GRADE_COLORS[aff.grade] ?? GRADE_COLORS.STARTER}`}
                      >
                        {aff.grade}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{aff.parrainageCode ?? "-"}</td>
                    <td className="px-5 py-3 text-right text-sm">{s?.leads ?? 0}</td>
                    <td className="px-5 py-3 text-right text-sm">{s?.deals ?? 0}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold">
                      {(s?.commission ?? 0).toFixed(0)} EUR
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${aff.isActive ? "bg-emerald-500" : "bg-neutral-300"}`}
                      />
                      <span className="ml-1.5 text-xs text-neutral-600">
                        {aff.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-neutral-400">
                      {aff.createdAt.toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
