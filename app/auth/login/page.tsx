"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError("Email requis")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error: authError } = await authClient.signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      })

      if (authError) {
        setError(authError.message ?? "Erreur d'envoi")
        return
      }

      setSent(true)
    } catch {
      setError("Erreur reseau")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-bold">Lien envoye</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Un lien de connexion a ete envoye a <strong>{email}</strong>. Verifiez votre boite
            de reception.
          </p>
          <button
            onClick={() => {
              setSent(false)
              setEmail("")
            }}
            className="mt-6 text-sm text-neutral-500 underline hover:text-neutral-900 transition-colors"
          >
            Utiliser un autre email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-black">
            <span className="text-sm font-bold text-white">eS</span>
          </div>
          <h1 className="text-lg font-bold">Connexion</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Entrez votre email pour recevoir un lien de connexion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              autoFocus
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      </div>
    </div>
  )
}
