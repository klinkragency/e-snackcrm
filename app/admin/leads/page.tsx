import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { leads, user } from "@/lib/db/schema"
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

export default async function AdminLeadsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (dbUser?.role !== "admin") redirect("/dashboard")

  const allLeads = await db
    .select({
      id: leads.id,
      step: leads.step,
      status: leads.status,
      clientFirstname: leads.clientFirstname,
      clientLastname: leads.clientLastname,
      clientEmail: leads.clientEmail,
      clientCompany: leads.clientCompany,
      scoring: leads.scoring,
      affiliateName: user.name,
      affiliateEmail: user.email,
      updatedAt: leads.updatedAt,
    })
    .from(leads)
    .innerJoin(user, eq(leads.affiliateId, user.id))
    .orderBy(desc(leads.updatedAt))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tous les leads</h1>

      {allLeads.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-500">Aucun lead dans le systeme.</p>
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
                  Entreprise
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Affilie
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
              {allLeads.map((lead) => (
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
                      href={`/admin/leads?id=${lead.id}`}
                      className="text-sm font-medium text-black hover:underline"
                    >
                      {lead.clientFirstname} {lead.clientLastname}
                    </Link>
                    <p className="text-xs text-neutral-400">{lead.clientEmail}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {lead.clientCompany ?? "-"}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium">{lead.affiliateName}</p>
                    <p className="text-xs text-neutral-400">{lead.affiliateEmail}</p>
                  </td>
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
                  <td className="px-5 py-3 text-xs text-neutral-600">{lead.status}</td>
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
