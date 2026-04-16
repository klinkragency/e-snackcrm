"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { stepDSchema, type StepDData } from "@/lib/validations"
import { cn } from "@/lib/utils"
import { Loader2, ExternalLink, Clock } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

type RevisionEntry = {
  date: string
  note: string
}

type Props = {
  leadId: string
  revisionHistory?: RevisionEntry[]
  initialValues?: Partial<StepDData>
  onSaved?: () => void
}

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"

const errorCls = "mt-1 text-xs text-red-500"

export function StepD({ leadId, revisionHistory = [], initialValues, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [refuseOpen, setRefuseOpen] = useState(false)
  const [refusing, setRefusing] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<StepDData>({
    defaultValues: {
      mockupUrl: "",
      mockupFeedback: "",
      mockupValidated: "PENDING",
      ...initialValues,
    },
  })

  const mockupValidated = watch("mockupValidated")

  const onSubmit = async (data: StepDData) => {
    const result = stepDSchema.safeParse(data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof StepDData
        setError(field, { message: issue.message })
      }
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, step: "D" }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur serveur")
      toast.success("Maquette enregistree")
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
        body: JSON.stringify({ mockupValidated: "REFUSED", status: "LOST" }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      toast.success("Maquette marquee comme refusee")
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
            Maquette
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Statut validation
              </label>
              <div className="flex gap-2">
                {(["PENDING", "VALIDATED", "REFUSED"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => s === "REFUSED" ? setRefuseOpen(true) : setValue("mockupValidated", s)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                      mockupValidated === s
                        ? s === "REFUSED"
                          ? "border-red-600 bg-red-600 text-white"
                          : s === "VALIDATED"
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-neutral-900 bg-neutral-900 text-white"
                        : s === "REFUSED"
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                    )}
                  >
                    {s === "PENDING" && "En attente"}
                    {s === "VALIDATED" && "Validee"}
                    {s === "REFUSED" && "Refusee"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                URL maquette <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input {...register("mockupUrl")} placeholder="https://figma.com/..." className={cn(inputCls, "flex-1")} />
                {watch("mockupUrl") && (
                  <a
                    href={watch("mockupUrl")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
              {errors.mockupUrl && <p className={errorCls}>{errors.mockupUrl.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Retour client</label>
              <textarea {...register("mockupFeedback")} rows={3} placeholder="Commentaires du client..." className={inputCls} />
            </div>
          </div>
        </div>

        {/* Revision history */}
        {revisionHistory.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
              Historique des revisions
            </h3>
            <div className="space-y-3">
              {revisionHistory.map((rev, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3"
                >
                  <Clock size={14} className="mt-0.5 shrink-0 text-neutral-400" />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-700">{rev.note}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {new Date(rev.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
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
            Enregistrer la maquette
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={refuseOpen}
        title="Refuser la maquette"
        description="Le lead sera marque comme perdu. Cette action est irreversible."
        confirmLabel="Marquer comme refusee"
        variant="danger"
        loading={refusing}
        onConfirm={handleRefuse}
        onCancel={() => setRefuseOpen(false)}
      />
    </>
  )
}
