"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Play, Square, Loader2, ExternalLink, Box, X, Terminal, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Props = {
  clientId: string
  clientSlug: string
  publicUrl: string | null
  composeProject: string | null
  canWrite: boolean
}

type DeployEvent =
  | { type: "phase"; phase: string; message: string }
  | { type: "log"; message: string }
  | { type: "error"; message: string }
  | { type: "done"; publicUrl: string; composeProject: string }

export function InstanceBlock({ clientId, clientSlug, publicUrl, composeProject, canWrite }: Props) {
  const router = useRouter()
  const [stopping, setStopping] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)
  const [events, setEvents] = useState<DeployEvent[]>([])
  const [deploying, setDeploying] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const isRunning = Boolean(publicUrl && composeProject)

  const appendEvent = useCallback((e: DeployEvent) => {
    setEvents((prev) => [...prev, e])
  }, [])

  const deploy = useCallback(async () => {
    if (deploying) return
    setEvents([])
    setLogsOpen(true)
    setDeploying(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch(`/api/clients/${clientId}/instance`, {
        method: "POST",
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events (blank line delimited)
        const chunks = buffer.split("\n\n")
        buffer = chunks.pop() ?? ""
        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .find((l) => l.startsWith("data:"))
            ?.replace(/^data:\s*/, "")
          if (!line) continue
          try {
            const event = JSON.parse(line) as DeployEvent
            appendEvent(event)
            if (event.type === "done") {
              toast.success("Instance démarrée")
              router.refresh()
            } else if (event.type === "error") {
              toast.error(event.message, { duration: 10000 })
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        appendEvent({ type: "error", message: err instanceof Error ? err.message : "Erreur" })
        toast.error(err instanceof Error ? err.message : "Erreur de déploiement", { duration: 10000 })
      }
    } finally {
      setDeploying(false)
      abortRef.current = null
    }
  }, [clientId, deploying, appendEvent, router])

  const stop = async () => {
    if (!confirm(`Arrêter et supprimer l'instance de ${clientSlug} ? Les données (commandes, menu) seront perdues.`)) return
    setStopping(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/instance`, { method: "DELETE" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur")
      toast.success("Instance arrêtée")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur", { duration: 8000 })
    } finally {
      setStopping(false)
    }
  }

  const forceCleanup = async () => {
    if (
      !confirm(
        `Force cleanup de ${clientSlug}: supprime tous les containers / networks / volumes / fichiers du stack même en état cassé. À utiliser si un déploiement a foiré et laisse des résidus.`
      )
    )
      return
    setCleaning(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/instance/cleanup`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur")
      toast.success(`Cleanup OK (${body.removed ?? 0} ressource(s) supprimée(s))`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur", { duration: 8000 })
    } finally {
      setCleaning(false)
    }
  }

  return (
    <>
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
                Aucune instance en cours. Clique sur <b>Lancer démo</b> pour cloner e-snack, configurer le .env depuis ce client, démarrer la stack Docker et exposer l&apos;URL via ngrok. Les logs s&apos;affichent en temps réel.
              </p>
            )}
          </div>

          {canWrite && (
            <div className="flex shrink-0 items-center gap-2">
              {events.length > 0 && !logsOpen && (
                <button
                  onClick={() => setLogsOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <Terminal size={13} />
                  Logs
                </button>
              )}
              {isRunning ? (
                <button
                  onClick={stop}
                  disabled={stopping || deploying || cleaning}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {stopping ? <Loader2 size={14} className="animate-spin" /> : <Square size={13} />}
                  Arrêter
                </button>
              ) : (
                <>
                  <button
                    onClick={forceCleanup}
                    disabled={deploying || cleaning || stopping}
                    title="Supprime tous les résidus d'un déploiement raté"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    {cleaning ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                  <button
                    onClick={deploy}
                    disabled={deploying || stopping || cleaning}
                    className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {deploying ? <Loader2 size={14} className="animate-spin" /> : <Play size={13} />}
                    Lancer démo
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {logsOpen && (
        <DeployLogsModal
          events={events}
          running={deploying}
          onClose={() => setLogsOpen(false)}
        />
      )}
    </>
  )
}

function DeployLogsModal({
  events,
  running,
  onClose,
}: {
  events: DeployEvent[]
  running: boolean
  onClose: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoscroll, setAutoscroll] = useState(true)

  useEffect(() => {
    if (!autoscroll || !scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [events, autoscroll])

  const lastPhase = [...events].reverse().find((e) => e.type === "phase")
  const isDone = events.some((e) => e.type === "done")
  const isError = events.some((e) => e.type === "error")

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 flex-col rounded-2xl bg-neutral-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "inline-block h-2 w-2 shrink-0 rounded-full",
                isError && "bg-red-500",
                !isError && isDone && "bg-green-500",
                !isError && !isDone && running && "animate-pulse bg-blue-500",
                !isError && !isDone && !running && "bg-neutral-500"
              )}
            />
            <h2 className="truncate text-sm font-semibold text-white">
              {isError ? "Déploiement échoué" : isDone ? "Déploiement terminé" : running ? (lastPhase?.message ?? "Déploiement en cours…") : "Logs"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget
            const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
            setAutoscroll(atBottom)
          }}
          className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-neutral-200"
        >
          {events.length === 0 && (
            <p className="text-neutral-500">En attente…</p>
          )}
          {events.map((e, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {e.type === "phase" && (
                <span className="font-semibold text-blue-400">▶ {e.message}</span>
              )}
              {e.type === "log" && <span className="text-neutral-300">{e.message}</span>}
              {e.type === "error" && (
                <span className="font-semibold text-red-400">✗ {e.message}</span>
              )}
              {e.type === "done" && (
                <span className="font-semibold text-green-400">✓ Live sur {e.publicUrl}</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 px-5 py-2">
          <p className="text-[11px] text-neutral-500">
            {events.length} ligne{events.length > 1 ? "s" : ""}
            {!autoscroll && <span className="ml-2 text-amber-400">Auto-scroll off</span>}
          </p>
          <button
            onClick={onClose}
            className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  )
}
