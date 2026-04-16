import { cn } from "@/lib/utils"
import { Check, Clock } from "lucide-react"

type Milestone = {
  id: string
  type: "ACOMPTE" | "INTERMEDIAIRE" | "SOLDE"
  amount: number
  commissionAmount: number
  status: "PENDING" | "PAID"
  dueDate?: string
  paidAt?: string
}

type Props = {
  finalAmount: number
  milestones: Milestone[]
  commissionRate: number
}

const TYPE_LABELS: Record<string, string> = {
  ACOMPTE: "Acompte",
  INTERMEDIAIRE: "Intermediaire",
  SOLDE: "Solde",
}

export function FinanceBlock({ finalAmount, milestones, commissionRate }: Props) {
  const totalPaid = milestones
    .filter((m) => m.status === "PAID")
    .reduce((sum, m) => sum + m.amount, 0)

  const totalCommission = milestones.reduce((sum, m) => sum + m.commissionAmount, 0)
  const paidCommission = milestones
    .filter((m) => m.status === "PAID")
    .reduce((sum, m) => sum + m.commissionAmount, 0)

  const progress = finalAmount > 0 ? Math.round((totalPaid / finalAmount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Montant total" value={`${finalAmount.toLocaleString("fr-FR")} EUR`} />
        <SummaryCard label="Encaisse" value={`${totalPaid.toLocaleString("fr-FR")} EUR`} accent="green" />
        <SummaryCard label="Commission totale" value={`${totalCommission.toLocaleString("fr-FR")} EUR`} />
        <SummaryCard label="Commission confirmee" value={`${paidCommission.toLocaleString("fr-FR")} EUR`} accent="green" />
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-700">Progression paiement</span>
          <span className="text-xs font-semibold text-neutral-500">{progress}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestones table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Echeance
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Montant
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Commission
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((m) => (
              <tr key={m.id} className="border-b border-neutral-50 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full",
                        m.status === "PAID" ? "bg-green-100" : "bg-neutral-100",
                      )}
                    >
                      {m.status === "PAID" ? (
                        <Check size={12} className="text-green-600" />
                      ) : (
                        <Clock size={12} className="text-neutral-400" />
                      )}
                    </div>
                    <span className="font-semibold text-neutral-900">
                      {TYPE_LABELS[m.type] || m.type}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-neutral-700">
                  {m.amount.toLocaleString("fr-FR")} EUR
                </td>
                <td className="px-5 py-3 text-right text-neutral-700">
                  {m.commissionAmount.toLocaleString("fr-FR")} EUR
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      m.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    {m.status === "PAID" ? "Paye" : "En attente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: "green"
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold",
          accent === "green" ? "text-green-600" : "text-neutral-900",
        )}
      >
        {value}
      </p>
    </div>
  )
}
