"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export type ClientFormValues = {
  name: string
  slug: string
  domain: string
  ownerEmail: string
  ownerName: string
  ownerPhone: string
  notes: string
  initialAdminEmail: string
  initialAdminPassword: string
  initialAdminName: string
  initialRestaurantName: string
  initialRestaurantSlug: string
  mollieApiKey: string
  resendApiKey: string
  emailFromAddress: string
}

const EMPTY_VALUES: ClientFormValues = {
  name: "",
  slug: "",
  domain: "",
  ownerEmail: "",
  ownerName: "",
  ownerPhone: "",
  notes: "",
  initialAdminEmail: "",
  initialAdminPassword: "",
  initialAdminName: "",
  initialRestaurantName: "",
  initialRestaurantSlug: "",
  mollieApiKey: "",
  resendApiKey: "",
  emailFromAddress: "",
}

type Props = {
  mode: "create" | "edit"
  clientId?: string
  initialValues?: Partial<ClientFormValues>
}

export function ClientForm({ mode, clientId, initialValues }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<ClientFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  })
  const [saving, setSaving] = useState(false)

  const update = (field: keyof ClientFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = mode === "create" ? "/api/clients" : `/api/clients/${clientId}`
      const method = mode === "create" ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || "Erreur serveur")
      }
      toast.success(mode === "create" ? "Client créé" : "Client mis à jour")
      const targetId = mode === "create" ? body.id : clientId
      router.push(`/clients/${targetId}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Informations client">
        <Field label="Nom du client" required>
          <input type="text" required value={values.name} onChange={update("name")} placeholder="Chez Mario" className={inputCls} />
        </Field>
        <Field label="Slug" required help="Utilisé pour le nom du dossier sur le VPS. Minuscules, tirets.">
          <input type="text" required value={values.slug} onChange={update("slug")} pattern="[a-z0-9-]+" placeholder="chez-mario" className={inputCls} />
        </Field>
        <Field label="Domaine" required>
          <input type="text" required value={values.domain} onChange={update("domain")} placeholder="chez-mario.fr" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom du contact" required>
            <input type="text" required value={values.ownerName} onChange={update("ownerName")} className={inputCls} />
          </Field>
          <Field label="Email du contact" required>
            <input type="email" required value={values.ownerEmail} onChange={update("ownerEmail")} className={inputCls} />
          </Field>
        </div>
        <Field label="Téléphone du contact">
          <input type="tel" value={values.ownerPhone} onChange={update("ownerPhone")} className={inputCls} />
        </Field>
        <Field label="Notes internes">
          <textarea value={values.notes} onChange={update("notes")} rows={3} className={inputCls} />
        </Field>
      </Section>

      <Section title="Config instance e-Snack" description="Ces valeurs seront injectées dans les env vars INITIAL_* du .env généré.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom du restaurant" required>
            <input type="text" required value={values.initialRestaurantName} onChange={update("initialRestaurantName")} placeholder="Chez Mario" className={inputCls} />
          </Field>
          <Field label="Slug du restaurant" required>
            <input type="text" required value={values.initialRestaurantSlug} onChange={update("initialRestaurantSlug")} pattern="[a-z0-9-]+" placeholder="chez-mario" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email admin restaurant" required>
            <input type="email" required value={values.initialAdminEmail} onChange={update("initialAdminEmail")} className={inputCls} />
          </Field>
          <Field label="Nom admin restaurant" required>
            <input type="text" required value={values.initialAdminName} onChange={update("initialAdminName")} className={inputCls} />
          </Field>
        </div>
        <Field label="Mot de passe admin restaurant" required help="Min. 8 caractères. Transmis au client pour son premier login.">
          <input type="text" required minLength={8} value={values.initialAdminPassword} onChange={update("initialAdminPassword")} className={inputCls} />
        </Field>
      </Section>

      <Section title="Clés tiers" description="Optionnelles — laisser vide pour désactiver la feature côté client.">
        <Field label="Mollie API key" help="Laisser vide = mode paiement sur place uniquement.">
          <input type="text" value={values.mollieApiKey} onChange={update("mollieApiKey")} placeholder="live_xxxxx" className={inputCls} />
        </Field>
        <Field label="Resend API key" help="Pour l'envoi des OTP et confirmations de commande.">
          <input type="text" value={values.resendApiKey} onChange={update("resendApiKey")} placeholder="re_xxxxx" className={inputCls} />
        </Field>
        <Field label="Email expéditeur" required>
          <input type="email" required value={values.emailFromAddress} onChange={update("emailFromAddress")} placeholder="no-reply@chez-mario.fr" className={inputCls} />
        </Field>
      </Section>

      <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {mode === "create" ? "Créer le client" : "Enregistrer"}
        </button>
      </div>
    </form>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">{title}</h3>
        {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
