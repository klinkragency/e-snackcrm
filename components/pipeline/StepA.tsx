"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { stepASchema, type StepAData } from "@/lib/validations"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  leadId?: string
  initialValues?: Partial<StepAData>
  onSaved?: () => void
}

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"

const errorCls = "mt-1 text-xs text-red-500"

export function StepA({ leadId, initialValues, onSaved }: Props) {
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StepAData>({
    defaultValues: {
      clientFirstname: "",
      clientLastname: "",
      clientEmail: "",
      clientPhone: "",
      clientCountry: "FR",
      clientCity: "",
      clientPostal: "",
      clientCompany: "",
      clientSector: "",
      clientWebsite: "",
      clientLinkedin: "",
      source: "",
      initialNote: "",
      ...initialValues,
    },
  })

  const onSubmit = async (data: StepAData) => {
    // Manual Zod validation (Zod v4 incompatible with zodResolver)
    const result = stepASchema.safeParse(data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof StepAData
        setError(field, { message: issue.message })
      }
      return
    }

    setSaving(true)
    try {
      const url = leadId ? `/api/leads/${leadId}` : "/api/leads"
      const method = leadId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, step: "A" }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur serveur")
      toast.success(leadId ? "Contact mis a jour" : "Lead cree")
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
          Informations contact
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Prenom <span className="text-red-500">*</span>
              </label>
              <input {...register("clientFirstname")} placeholder="Jean" className={inputCls} />
              {errors.clientFirstname && <p className={errorCls}>{errors.clientFirstname.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Nom <span className="text-red-500">*</span>
              </label>
              <input {...register("clientLastname")} placeholder="Dupont" className={inputCls} />
              {errors.clientLastname && <p className={errorCls}>{errors.clientLastname.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input {...register("clientEmail")} type="email" placeholder="jean@example.com" className={inputCls} />
              {errors.clientEmail && <p className={errorCls}>{errors.clientEmail.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Telephone <span className="text-red-500">*</span>
              </label>
              <input {...register("clientPhone")} type="tel" placeholder="+33 6 12 34 56 78" className={inputCls} />
              {errors.clientPhone && <p className={errorCls}>{errors.clientPhone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Ville</label>
              <input {...register("clientCity")} placeholder="Paris" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Code postal</label>
              <input {...register("clientPostal")} placeholder="75001" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Pays <span className="text-red-500">*</span>
              </label>
              <input {...register("clientCountry")} placeholder="FR" className={inputCls} />
              {errors.clientCountry && <p className={errorCls}>{errors.clientCountry.message}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-500">
          Entreprise & contexte
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Entreprise</label>
              <input {...register("clientCompany")} placeholder="Chez Mario SARL" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Secteur</label>
              <input {...register("clientSector")} placeholder="Restauration" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Site web</label>
              <input {...register("clientWebsite")} placeholder="https://chez-mario.fr" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">LinkedIn</label>
              <input {...register("clientLinkedin")} placeholder="https://linkedin.com/in/..." className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Source</label>
            <input {...register("source")} placeholder="Parrainage, salon, web..." className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Note initiale</label>
            <textarea {...register("initialNote")} rows={3} placeholder="Contexte, premier contact..." className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50",
          )}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {leadId ? "Mettre a jour" : "Creer le lead"}
        </button>
      </div>
    </form>
  )
}
