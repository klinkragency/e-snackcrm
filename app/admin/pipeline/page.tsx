import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { leads, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const STEPS = ["A", "B", "C", "D", "E"] as const
const STEP_LABELS: Record<string, string> = {
  A: "Prospection",
  B: "Qualification",
  C: "Proposition",
  D: "Negociation",
  E: "Cloture",
}
const STEP_COLORS: Record<string, string> = {
  A: "border-blue-200 bg-blue-50",
  B: "border-amber-200 bg-amber-50",
  C: "border-purple-200 bg-purple-50",
  D: "border-orange-200 bg-orange-50",
  E: "border-emerald-200 bg-emerald-50",
}
const STEP_HEADER_COLORS: Record<string, string> = {
  A: "bg-blue-500",
  B: "bg-amber-500",
  C: "bg-purple-500",
  D: "bg-orange-500",
  E: "bg-emerald-500",
}

export default async function PipelinePage() {
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
      clientCompany: leads.clientCompany,
      scoring: leads.scoring,
      affiliateId: leads.affiliateId,
      affiliateName: user.name,
      updatedAt: leads.updatedAt,
    })
    .from(leads)
    .innerJoin(user, eq(leads.affiliateId, user.id))
    .where(eq(leads.status, "ACTIVE"))

  const grouped: Record<string, typeof allLeads> = {}
  for (const step of STEPS) {
    grouped[step] = allLeads.filter((l) => l.step === step)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pipeline</h1>

      <div className="grid grid-cols-5 gap-4">
        {STEPS.map((step) => (
          <div key={step} className="space-y-3">
            {/* Column header */}
            <div className={`rounded-xl p-3 text-center ${STEP_HEADER_COLORS[step]} text-white`}>
              <p className="text-xs font-semibold uppercase tracking-wider">
                {step} - {STEP_LABELS[step]}
              </p>
              <p className="text-lg font-bold">{grouped[step].length}</p>
            </div>

            {/* Cards */}
            {grouped[step].map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads?id=${lead.id}`}
                className={`block rounded-xl border p-3 shadow-sm hover:shadow-md transition-shadow ${STEP_COLORS[step]}`}
              >
                <p className="text-sm font-semibold">
                  {lead.clientFirstname} {lead.clientLastname}
                </p>
                {lead.clientCompany && (
                  <p className="text-xs text-neutral-500">{lead.clientCompany}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500">{lead.affiliateName}</span>
                  {lead.scoring && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        lead.scoring === "HOT"
                          ? "bg-red-100 text-red-700"
                          : lead.scoring === "WARM"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {lead.scoring}
                    </span>
                  )}
                </div>
              </Link>
            ))}

            {grouped[step].length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400">
                Aucun lead
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
