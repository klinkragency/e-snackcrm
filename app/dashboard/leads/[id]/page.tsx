import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  leads,
  comments,
  timelineEvents,
  payments,
  user,
} from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

const STEPS = ["A", "B", "C", "D", "E"] as const
const STEP_LABELS: Record<string, string> = {
  A: "Prospection",
  B: "Qualification",
  C: "Proposition",
  D: "Negociation",
  E: "Cloture",
}
const STEP_COLORS: Record<string, string> = {
  A: "bg-blue-500",
  B: "bg-amber-500",
  C: "bg-purple-500",
  D: "bg-orange-500",
  E: "bg-emerald-500",
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.affiliateId, session.user.id)))
    .limit(1)

  if (!lead) notFound()

  const leadComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      authorName: user.name,
    })
    .from(comments)
    .innerJoin(user, eq(comments.authorId, user.id))
    .where(eq(comments.leadId, id))
    .orderBy(desc(comments.createdAt))

  const timeline = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.leadId, id))
    .orderBy(desc(timelineEvents.createdAt))

  const leadPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.leadId, id))
    .orderBy(desc(payments.createdAt))

  const currentStepIdx = STEPS.indexOf(lead.step as (typeof STEPS)[number])

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/leads"
        className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        &larr; Retour aux leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {lead.clientFirstname} {lead.clientLastname}
          </h1>
          <p className="text-sm text-neutral-500">
            {lead.clientCompany ?? lead.clientEmail}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${STEP_COLORS[lead.step] ?? "bg-neutral-400"}`}
        >
          Etape {lead.step} - {STEP_LABELS[lead.step]}
        </span>
      </div>

      {/* Pipeline Nav */}
      <div className="flex gap-1 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        {STEPS.map((step, idx) => {
          const isActive = idx <= currentStepIdx
          return (
            <div
              key={step}
              className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors ${
                isActive
                  ? `${STEP_COLORS[step]} text-white`
                  : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {step} - {STEP_LABELS[step]}
            </div>
          )
        })}
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Client Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Client
          </h2>
          <dl className="space-y-2 text-sm">
            {[
              ["Email", lead.clientEmail],
              ["Telephone", lead.clientPhone],
              ["Ville", lead.clientCity],
              ["Entreprise", lead.clientCompany],
              ["Secteur", lead.clientSector],
              ["Site web", lead.clientWebsite],
              ["Source", lead.source],
              ["Scoring", lead.scoring],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
          </dl>
          {lead.initialNote && (
            <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
              {lead.initialNote}
            </div>
          )}
        </div>

        {/* Timeline + Comments */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Timeline
            </h2>
            {timeline.length === 0 ? (
              <p className="text-xs text-neutral-400">Aucun evenement</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((event) => (
                  <div key={event.id} className="flex gap-3 text-xs">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-neutral-300" />
                    <div>
                      <p className="font-medium">{event.description}</p>
                      <p className="text-neutral-400">
                        {event.createdAt.toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Commentaires
            </h2>
            {leadComments.length === 0 ? (
              <p className="text-xs text-neutral-400">Aucun commentaire</p>
            ) : (
              <div className="space-y-3">
                {leadComments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-neutral-50 p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{c.authorName}</span>
                      <span className="text-neutral-400">
                        {c.createdAt.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-neutral-600">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Finance */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Finance
          </h2>
          {lead.quoteAmount && (
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-neutral-500">Devis</span>
              <span className="font-semibold">{lead.quoteAmount.toFixed(2)} EUR</span>
            </div>
          )}
          {lead.finalAmount && (
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-neutral-500">Montant final</span>
              <span className="font-semibold">{lead.finalAmount.toFixed(2)} EUR</span>
            </div>
          )}

          <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Paiements
          </h3>
          {leadPayments.length === 0 ? (
            <p className="text-xs text-neutral-400">Aucun paiement</p>
          ) : (
            <div className="space-y-2">
              {leadPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 p-2 text-xs"
                >
                  <div>
                    <span className="font-medium">{p.type}</span>
                    <span className="ml-2 text-neutral-500">{p.amount.toFixed(2)} EUR</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      p.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
