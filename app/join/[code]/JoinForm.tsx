"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

const joinSchema = z.object({
  firstName: z.string().min(1, "Prenom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(6, "Telephone requis"),
  city: z.string().optional(),
  password: z.string().min(8, "Minimum 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type JoinFormData = z.infer<typeof joinSchema>

const EMPTY_FORM: JoinFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  password: "",
  confirmPassword: "",
}

export function JoinForm({ sponsorCode }: { sponsorCode: string }) {
  const router = useRouter()
  const [form, setForm] = useState<JoinFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof JoinFormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  function validate(): boolean {
    const result = joinSchema.safeParse(form)
    if (result.success) {
      setErrors({})
      return true
    }

    const fieldErrors: Partial<Record<keyof JoinFormData, string>> = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof JoinFormData
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    setErrors(fieldErrors)
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError("")

    try {
      const res = await fetch("/api/crm/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sponsorCode,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur serveur" }))
        setServerError(data.error ?? "Erreur serveur")
        return
      }

      router.push("/auth/login?registered=true")
    } catch {
      setServerError("Erreur reseau")
    } finally {
      setSubmitting(false)
    }
  }

  function field(key: keyof JoinFormData, label: string, type = "text") {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </label>
        <input
          type={type}
          value={form[key] ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        {errors[key] && <p className="mt-0.5 text-xs text-red-500">{errors[key]}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {field("firstName", "Prenom")}
        {field("lastName", "Nom")}
      </div>

      {field("email", "Email", "email")}
      {field("phone", "Telephone", "tel")}
      {field("city", "Ville")}

      {field("password", "Mot de passe", "password")}
      {field("confirmPassword", "Confirmer le mot de passe", "password")}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Inscription..." : "Creer mon compte"}
      </button>
    </form>
  )
}
