"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { stepBSchema, type StepBData } from "@/lib/validations"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ScoringBadge } from "@/components/shared/ScoringBadge"

type Props = {
  leadId: string
  commissionRate?: number
  initialValues?: Partial<StepBData>
  onSaved?: () => void
}

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"

const errorCls = "mt-1 text-xs text-red-500"

export function StepB({ leadId, commissionRate = 0.05, initialValues, onSaved }: Props) {
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<StepBData>({
    defaultValues: {
      scoring: undefined,
      mainNeed: "",
      solution: "",
      budgetEstimated: undefined,
      delayWanted: "",
      decisionMaker: undefined,
      decisionMakerName: "",
      competitiveContext: "",
      objections: "",
      ...initialValues,
    },
  })

  const budget = watch("budgetEstimated")
  const scoring = watch("scoring")
  const estimatedCommission = budget ? budget * commissionRate : 0

  const onSubmit = async (data: StepBData) => {
    const result = stepBSchema.safeParse(data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof StepBData
        setError(field, { message: issue.message })
      }
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, step: "B" }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur serveur")
      toast.success("Qualification enregistree")
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Qualification
        </h3>
        <div className="space-y-4">
          {/* Scoring */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
              Scoring <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(["HOT", "WARM", "COLD"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue("scoring", s)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                    scoring === s
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {scoring && (
              <div className="mt-2">
                <ScoringBadge scoring={scoring} />
              </div>
            )}
            {errors.scoring && <p className={errorCls}>{errors.scoring.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
              Besoin principal <span className="text-red-500">*</span>
            </label>
            <textarea {...register("mainNeed")} rows={3} placeholder="Commande en ligne, click & collect..." className={inputCls} />
            {errors.mainNeed && <p className={errorCls}>{errors.mainNeed.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Solution proposee</label>
            <input {...register("solution")} placeholder="e-Snack Standard + Mollie" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Budget estime</label>
              <input
                type="number"
                step="0.01"
                {...register("budgetEstimated", { valueAsNumber: true })}
                placeholder="2500"
                className={inputCls}
              />
              {errors.budgetEstimated && <p className={errorCls}>{errors.budgetEstimated.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Delai souhaite</label>
              <input {...register("delayWanted")} placeholder="2 semaines" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Decideur ?</label>
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setValue("decisionMaker", v)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                      watch("decisionMaker") === v
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                    )}
                  >
                    {v ? "Oui" : "Non"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Nom decideur</label>
              <input {...register("decisionMakerName")} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Contexte concurrentiel</label>
            <textarea {...register("competitiveContext")} rows={2} className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Objections</label>
            <textarea {...register("objections")} rows={2} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Commission estimate */}
      {budget && budget > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
            Commission estimee
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900">
              {estimatedCommission.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </span>
            <span className="text-xs text-neutral-500">
              ({(commissionRate * 100).toFixed(0)}% de {budget.toLocaleString("fr-FR")} EUR)
            </span>
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
          Enregistrer la qualification
        </button>
      </div>
    </form>
  )
}
