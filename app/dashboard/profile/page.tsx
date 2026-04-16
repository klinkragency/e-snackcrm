"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface ProfileData {
  firstName: string
  lastName: string
  phone: string
  city: string
  bio: string
  iban: string
}

const EMPTY_PROFILE: ProfileData = {
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  bio: "",
  iban: "",
}

export default function ProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/crm/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setForm({
            firstName: data.profile.firstName ?? "",
            lastName: data.profile.lastName ?? "",
            phone: data.profile.phone ?? "",
            city: data.profile.city ?? "",
            bio: data.profile.bio ?? "",
            iban: data.profile.iban ?? "",
          })
        }
      })
      .catch(() => setError("Impossible de charger le profil"))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")

    try {
      const res = await fetch("/api/crm/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur serveur" }))
        setError(data.error ?? "Erreur serveur")
        return
      }

      setMessage("Profil mis a jour")
      router.refresh()
    } catch {
      setError("Erreur reseau")
    } finally {
      setSaving(false)
    }
  }

  function field(key: keyof ProfileData, label: string, type = "text") {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {field("firstName", "Prenom")}
          {field("lastName", "Nom")}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field("phone", "Telephone", "tel")}
          {field("city", "Ville")}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        {field("iban", "IBAN")}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  )
}
