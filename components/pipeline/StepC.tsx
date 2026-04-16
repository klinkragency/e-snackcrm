"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { stepCSchema, type StepCData } from "@/lib/validations"
import { cn } from "@/lib/utils"
import { Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

type CatalogItem = {
  name: string
  price: number
}

type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REFUSED"

type Props = {
  leadId: string
  catalog?: CatalogItem[]
  initialValues?: Partial<StepCData>
  initialQuoteStatus?: QuoteStatus
  onSaved?: () => void
}

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"

const errorCls = "mt-1 text-xs text-red-500"

export function StepC({ leadId, catalog = [], initialValues, initialQuoteStatus = "DRAFT", onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [refuseOpen, setRefuseOpen] = useState(false)
  const [refusing, setRefusing] = useState(false)
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>(initialQuoteStatus)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<StepCData>({
    defaultValues: {
      quoteAmount: 0,
      quoteUrl: "",
      quoteValidity: "",
      quoteDiscount: undefined,
      quoteFeedback: "",
      ...initialValues,
    },
  })

  const quoteAmount = watch("quoteAmount")

  const onSubmit = async (data: StepCData) => {
    const result = stepCSchema.safeParse(data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof StepCData
        setError(field, { message: issue.message })
      }
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, quoteStatus, step: "C" }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur serveur")
      toast.success("Devis enregistre")
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const handleRefuse = async () => {
    setRefusing(true)
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteStatus: "REFUSED", status: "LOST" }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      toast.success("Devis marque comme refuse")
      setRefuseOpen(false)
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setRefusing(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-500">
            Devis
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Statut
              </label>
              <div className="flex gap-2">
                {(["DRAFT", "SENT", "ACCEPTED", "REFUSED"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => s === "REFUSED" ? setRefuseOpen(true) : setQuoteStatus(s)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                      quoteStatus === s
                        ? s === "REFUSED"
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-neutral-900 bg-neutral-900 text-white"
                        : s === "REFUSED"
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                    )}
                  >
                    {s === "DRAFT" && "Brouillon"}
                    {s === "SENT" && "Envoye"}
                    {s === "ACCEPTED" && "Accepte"}
                    {s === "REFUSED" && "Refuse"}
                  </button>
                ))}
              </div>
              {/* quoteStatus managed via local state */}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Montant du devis <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("quoteAmount", { valueAsNumber: true })}
                  placeholder="2500"
                  className={inputCls}
                />
                {errors.quoteAmount && <p className={errorCls}>{errors.quoteAmount.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Remise (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register("quoteDiscount", { valueAsNumber: true })}
                  placeholder="10"
                  className={inputCls}
                />
                {errors.quoteDiscount && <p className={errorCls}>{errors.quoteDiscount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">URL du devis</label>
                <input {...register("quoteUrl")} placeholder="https://..." className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Validite</label>
                <input type="date" {...register("quoteValidity")} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Retour client</label>
              <textarea {...register("quoteFeedback")} rows={3} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Catalog price comparison */}
        {catalog.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
              Comparaison catalogue
            </h3>
            <div className="overflow-hidden rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Solution
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Prix catalogue
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Ecart
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((item) => {
                    const diff = (quoteAmount || 0) - item.price
                    return (
                      <tr key={item.name} className="border-b border-neutral-50 last:border-0">
                        <td className="px-4 py-2 text-neutral-700">{item.name}</td>
                        <td className="px-4 py-2 text-right text-neutral-700">
                          {item.price.toLocaleString("fr-FR")} EUR
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2 text-right font-semibold",
                            diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-neutral-500",
                          )}
                        >
                          {diff >= 0 ? "+" : ""}
                          {diff.toLocaleString("fr-FR")} EUR
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Enregistrer le devis
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={refuseOpen}
        title="Refuser le devis"
        description="Le lead sera marque comme perdu. Cette action est irreversible."
        confirmLabel="Marquer comme refuse"
        variant="danger"
        loading={refusing}
        onConfirm={handleRefuse}
        onCancel={() => setRefuseOpen(false)}
      />
    </>
  )
}
