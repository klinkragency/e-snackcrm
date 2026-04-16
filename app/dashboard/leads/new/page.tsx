"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface FormData {
  clientFirstname: string
  clientLastname: string
  clientEmail: string
  clientPhone: string
  clientCity: string
  clientCompany: string
  source: string
  initialNote: string
}

const INITIAL_FORM: FormData = {
  clientFirstname: "",
  clientLastname: "",
  clientEmail: "",
  clientPhone: "",
  clientCity: "",
  clientCompany: "",
  source: "",
  initialNote: "",
}

export default function NewLeadPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.clientFirstname.trim()) errs.clientFirstname = "Prenom requis"
    if (!form.clientLastname.trim()) errs.clientLastname = "Nom requis"
    if (!form.clientEmail.trim()) errs.clientEmail = "Email requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail))
      errs.clientEmail = "Email invalide"
    if (!form.clientPhone.trim()) errs.clientPhone = "Telephone requis"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError("")

    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur serveur" }))
        setServerError(data.error ?? "Erreur serveur")
        return
      }

      const data = await res.json()
      router.push(`/dashboard/leads/${data.id}`)
    } catch {
      setServerError("Erreur reseau")
    } finally {
      setSubmitting(false)
    }
  }

  function field(key: keyof FormData, label: string, type = "text", required = false) {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        {errors[key] && <p className="mt-0.5 text-xs text-red-500">{errors[key]}</p>}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nouveau lead</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {serverError && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {field("clientFirstname", "Prenom", "text", true)}
          {field("clientLastname", "Nom", "text", true)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field("clientEmail", "Email", "email", true)}
          {field("clientPhone", "Telephone", "tel", true)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field("clientCity", "Ville")}
          {field("clientCompany", "Entreprise")}
        </div>

        {field("source", "Source")}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Note initiale
          </label>
          <textarea
            value={form.initialNote}
            onChange={(e) => setForm((f) => ({ ...f, initialNote: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creation..." : "Creer le lead"}
          </button>
        </div>
      </form>
    </div>
  )
}
