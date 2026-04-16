import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

const STEP_COLORS: Record<string, string> = {
  A: "bg-blue-500",
  B: "bg-amber-500",
  C: "bg-purple-500",
  D: "bg-orange-500",
  E: "bg-emerald-500",
}

const SCORING_STYLES: Record<string, string> = {
  HOT: "bg-red-100 text-red-700",
  WARM: "bg-amber-100 text-amber-700",
  COLD: "bg-blue-100 text-blue-700",
}

export default async function LeadsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const userLeads = await db
    .select()
    .from(leads)
    .where(eq(leads.affiliateId, session.user.id))
    .orderBy(desc(leads.updatedAt))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes leads</h1>
        <Link
          href="/dashboard/leads/new"
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
        >
          + Nouveau lead
        </Link>
      </div>

      {userLeads.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-500">Aucun lead pour le moment.</p>
          <Link
            href="/dashboard/leads/new"
            className="mt-3 inline-block text-sm font-medium text-black underline"
          >
            Creer votre premier lead
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Etape
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Client
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Scoring
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Statut
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Modifie
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {userLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${STEP_COLORS[lead.step] ?? "bg-neutral-300"}`}
                      />
                      <span className="text-sm font-medium">{lead.step}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="text-sm font-medium text-black hover:underline"
                    >
                      {lead.clientFirstname} {lead.clientLastname}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">{lead.clientEmail}</td>
                  <td className="px-5 py-3">
                    {lead.scoring ? (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${SCORING_STYLES[lead.scoring] ?? ""}`}
                      >
                        {lead.scoring}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-neutral-600">{lead.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-400">
                    {lead.updatedAt.toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
