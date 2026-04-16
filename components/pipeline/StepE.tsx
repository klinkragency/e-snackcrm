"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

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
  leadId: string
  milestones: Milestone[]
  finalAmount?: number
  commissionRate?: number
  isAdmin?: boolean
  onUpdated?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  ACOMPTE: "Acompte",
  INTERMEDIAIRE: "Intermediaire",
  SOLDE: "Solde",
}

export function StepE({
  leadId,
  milestones,
  finalAmount = 0,
  commissionRate = 0.05,
  isAdmin = false,
  onUpdated,
}: Props) {
  const [markingId, setMarkingId] = useState<string | null>(null)

  const totalPaid = milestones
    .filter((m) => m.status === "PAID")
    .reduce((sum, m) => sum + m.amount, 0)

  const totalCommission = milestones.reduce((sum, m) => sum + m.commissionAmount, 0)
  const paidCommission = milestones
    .filter((m) => m.status === "PAID")
    .reduce((sum, m) => sum + m.commissionAmount, 0)

  const progress = finalAmount > 0 ? Math.round((totalPaid / finalAmount) * 100) : 0

  const handleMarkPaid = async (milestoneId: string) => {
    setMarkingId(milestoneId)
    try {
      const res = await fetch(`/api/leads/${leadId}/payments/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      toast.success("Paiement marque comme recu")
      onUpdated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment progress */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Paiements
        </h3>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700">
              {totalPaid.toLocaleString("fr-FR")} / {finalAmount.toLocaleString("fr-FR")} EUR
            </span>
            <span className="text-xs font-semibold text-neutral-500">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-3">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 transition-colors",
                m.status === "PAID"
                  ? "border-green-200 bg-green-50"
                  : "border-neutral-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  m.status === "PAID" ? "bg-green-500" : "bg-neutral-200",
                )}
              >
                {m.status === "PAID" ? (
                  <Check size={14} className="text-white" />
                ) : (
                  <Clock size={14} className="text-neutral-500" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">
                    {TYPE_LABELS[m.type] || m.type}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      m.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    {m.status === "PAID" ? "Paye" : "En attente"}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-neutral-500">
                  <span>{m.amount.toLocaleString("fr-FR")} EUR</span>
                  {m.dueDate && (
                    <span>
                      Echeance: {new Date(m.dueDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                  {m.paidAt && (
                    <span>
                      Paye le: {new Date(m.paidAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>

              {isAdmin && m.status === "PENDING" && (
                <button
                  type="button"
                  onClick={() => handleMarkPaid(m.id)}
                  disabled={markingId === m.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                >
                  {markingId === m.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  Marquer paye
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Commission block */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Commission
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-500">Taux</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">
              {(commissionRate * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500">Confirmee</p>
            <p className="mt-1 text-lg font-bold text-green-600">
              {paidCommission.toLocaleString("fr-FR")} EUR
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500">Totale estimee</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">
              {totalCommission.toLocaleString("fr-FR")} EUR
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
