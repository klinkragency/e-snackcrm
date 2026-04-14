"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth/client"
import { Loader2, Mail, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/clients"

  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("sending")
    setErrorMessage("")
    try {
      const { error } = await signIn.magicLink({
        email: email.trim(),
        callbackURL: redirectTo,
      })
      if (error) {
        setStatus("error")
        setErrorMessage(error.message || "Impossible d'envoyer le lien")
        return
      }
      setStatus("sent")
    } catch (err) {
      setStatus("error")
      setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-black">
            <Mail size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Klinkragency</h1>
          <p className="mt-1 text-sm text-neutral-500">Dashboard interne</p>
        </div>

        {status === "sent" ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <Mail size={18} className="text-green-600" />
            </div>
            <h2 className="mb-1 text-base font-semibold text-neutral-900">Lien envoyé</h2>
            <p className="text-sm text-neutral-500">
              Vérifie ta boîte mail <span className="font-medium text-neutral-700">{email}</span>. Le lien expire dans 15 minutes.
            </p>
            <button
              onClick={() => {
                setStatus("idle")
                setEmail("")
              }}
              className="mt-6 text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
            >
              Utiliser un autre email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@klinkragency.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "sending"}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-50"
            />

            {status === "error" && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending" || !email.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {status === "sending" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Recevoir mon lien
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-neutral-400">
              Accès réservé aux membres Klinkragency.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
