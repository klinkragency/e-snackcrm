"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Play, Square, Loader2, ExternalLink, Box } from "lucide-react"
import { toast } from "sonner"

type Props = {
  clientId: string
  clientSlug: string
  publicUrl: string | null
  composeProject: string | null
  canWrite: boolean
}

export function InstanceBlock({ clientId, clientSlug, publicUrl, composeProject, canWrite }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<"deploy" | "stop" | null>(null)

  const isRunning = Boolean(publicUrl && composeProject)

  const deploy = async () => {
    if (!confirm(`Cloner e-snack + build + démarrer l'instance pour ${clientSlug} ? Peut prendre 1-3 min au premier déploiement.`)) return
    setBusy("deploy")
    try {
      const res = await fetch(`/api/clients/${clientId}/instance`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur")
      toast.success("Instance démarrée")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de déploiement", { duration: 10000 })
    } finally {
      setBusy(null)
    }
  }

  const stop = async () => {
    if (!confirm(`Arrêter et supprimer l'instance de ${clientSlug} ? Les données (commandes, menu) seront perdues.`)) return
    setBusy("stop")
    try {
      const res = await fetch(`/api/clients/${clientId}/instance`, { method: "DELETE" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur")
      toast.success("Instance arrêtée")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur", { duration: 8000 })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
            Instance démo
          </h3>
          {isRunning ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-neutral-900">En cours</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-700">
                  {composeProject}
                </span>
              </div>
              <a
                href={publicUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
              >
                {publicUrl}
                <ExternalLink size={13} />
              </a>
              <p className="text-xs text-neutral-500">
                URL publique ngrok. Tunnel maintenu tant que l&apos;instance tourne.
              </p>
              <Link
                href="/containers"
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                <Box size={12} />
                Voir les containers de ce client
              </Link>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              Aucune instance en cours. Clique sur <b>Lancer démo</b> pour cloner e-snack, configurer automatiquement le .env avec la config de ce client, démarrer la stack Docker et exposer l&apos;URL via ngrok.
            </p>
          )}
        </div>

        {canWrite && (
          <div className="shrink-0">
            {isRunning ? (
              <button
                onClick={stop}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {busy === "stop" ? <Loader2 size={14} className="animate-spin" /> : <Square size={13} />}
                Arrêter
              </button>
            ) : (
              <button
                onClick={deploy}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy === "deploy" ? <Loader2 size={14} className="animate-spin" /> : <Play size={13} />}
                Lancer démo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
