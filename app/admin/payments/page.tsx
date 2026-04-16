import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { payments, leads, user } from "@/lib/db/schema"
import { eq, desc, sum } from "drizzle-orm"

export default async function AdminPaymentsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (dbUser?.role !== "admin") redirect("/dashboard")

  const allPayments = await db
    .select({
      id: payments.id,
      type: payments.type,
      amount: payments.amount,
      commissionAmount: payments.commissionAmount,
      status: payments.status,
      dueDate: payments.dueDate,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      clientFirstname: leads.clientFirstname,
      clientLastname: leads.clientLastname,
      affiliateName: user.name,
      affiliateEmail: user.email,
    })
    .from(payments)
    .innerJoin(leads, eq(payments.leadId, leads.id))
    .innerJoin(user, eq(payments.affiliateId, user.id))
    .orderBy(desc(payments.createdAt))

  const pendingPayments = allPayments.filter((p) => p.status === "PENDING")
  const paidPayments = allPayments.filter((p) => p.status === "PAID")

  const [pendingTotal] = await db
    .select({ value: sum(payments.commissionAmount) })
    .from(payments)
    .where(eq(payments.status, "PENDING"))

  const [paidTotal] = await db
    .select({ value: sum(payments.commissionAmount) })
    .from(payments)
    .where(eq(payments.status, "PAID"))

  function renderTable(items: typeof allPayments, title: string, total: string, showAction: boolean) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <span className="text-sm font-bold">{total} EUR</span>
        </div>
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">Aucun paiement</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Client
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Affilie
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Type
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Montant
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Commission
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Date
                </th>
                {showAction && (
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium">
                    {p.clientFirstname} {p.clientLastname}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm">{p.affiliateName}</p>
                    <p className="text-xs text-neutral-400">{p.affiliateEmail}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-600">{p.type}</td>
                  <td className="px-5 py-3 text-right text-sm">{p.amount.toFixed(2)} EUR</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold">
                    {p.commissionAmount.toFixed(2)} EUR
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-400">
                    {(p.paidAt ?? p.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  {showAction && (
                    <td className="px-5 py-3">
                      <form method="POST" action="/api/crm/payments">
                        <input type="hidden" name="paymentId" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
                        >
                          Marquer paye
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Paiements</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            En attente
          </p>
          <p className="mt-1 text-2xl font-bold">
            {Number(pendingTotal?.value ?? 0).toFixed(2)} EUR
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Verses
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {Number(paidTotal?.value ?? 0).toFixed(2)} EUR
          </p>
        </div>
      </div>

      {renderTable(pendingPayments, "En attente de paiement", Number(pendingTotal?.value ?? 0).toFixed(2), true)}
      {renderTable(paidPayments, "Paiements effectues", Number(paidTotal?.value ?? 0).toFixed(2), false)}
    </div>
  )
}
