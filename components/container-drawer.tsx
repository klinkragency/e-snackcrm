"use client"

import { useEffect, useState, useCallback } from "react"
import {
  X,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Loader2,
  Activity,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ContainerInfo = {
  Id: string
  Name: string
  Image: string
  Created: string
  State: {
    Status: string
    Running: boolean
    StartedAt: string
    FinishedAt: string
    ExitCode: number
    Error: string
  }
  Config: {
    Labels: Record<string, string>
    Env: string[]
    Image: string
  }
  NetworkSettings: {
    Ports: Record<string, Array<{ HostIp: string; HostPort: string }> | null>
  }
}

type Props = {
  containerId: string | null
  canWrite: boolean
  onClose: () => void
  onAction: () => void
}

export function ContainerDrawer({ containerId, canWrite, onClose, onAction }: Props) {
  const [info, setInfo] = useState<ContainerInfo | null>(null)
  const [logs, setLogs] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const [infoRes, logsRes] = await Promise.all([
        fetch(`/api/containers/${id}`, { cache: "no-store" }),
        fetch(`/api/containers/${id}/logs?tail=200`, { cache: "no-store" }),
      ])
      if (infoRes.ok) {
        const { container } = await infoRes.json()
        setInfo(container)
      }
      if (logsRes.ok) {
        const { logs } = await logsRes.json()
        setLogs(logs)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!containerId) {
      setInfo(null)
      setLogs("")
      return
    }
    load(containerId)
    const t = setInterval(() => load(containerId), 5000)
    return () => clearInterval(t)
  }, [containerId, load])

  const runAction = async (action: "start" | "stop" | "restart" | "delete") => {
    if (!containerId) return
    const confirmMsg =
      action === "delete"
        ? `Supprimer définitivement ${info?.Name}? Les données du container seront perdues.`
        : null
    if (confirmMsg && !confirm(confirmMsg)) return

    setPendingAction(action)
    try {
      const res =
        action === "delete"
          ? await fetch(`/api/containers/${containerId}`, { method: "DELETE" })
          : await fetch(`/api/containers/${containerId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action }),
            })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur")
      toast.success({ start: "Container démarré", stop: "Container arrêté", restart: "Container redémarré", delete: "Container supprimé" }[action])
      onAction()
      if (action === "delete") onClose()
      else load(containerId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setPendingAction(null)
    }
  }

  if (!containerId) return null

  const isRunning = info?.State.Running ?? false
  const containerName = info?.Name.replace(/^\//, "") ?? "Chargement…"

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  isRunning ? "bg-green-500" : "bg-red-500"
                )}
              />
              <h2 className="truncate text-lg font-bold tracking-tight">{containerName}</h2>
            </div>
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {info?.Image ?? info?.Config.Image}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        {canWrite && info && (
          <div className="flex items-center gap-2 border-b border-neutral-200 px-6 py-3">
            {isRunning ? (
              <ActionBtn
                icon={<Square size={13} />}
                label="Arrêter"
                onClick={() => runAction("stop")}
                pending={pendingAction === "stop"}
                variant="default"
              />
            ) : (
              <ActionBtn
                icon={<Play size={13} />}
                label="Démarrer"
                onClick={() => runAction("start")}
                pending={pendingAction === "start"}
                variant="primary"
              />
            )}
            <ActionBtn
              icon={<RotateCcw size={13} />}
              label="Redémarrer"
              onClick={() => runAction("restart")}
              pending={pendingAction === "restart"}
              variant="default"
              disabled={!isRunning}
            />
            <div className="ml-auto">
              <ActionBtn
                icon={<Trash2 size={13} />}
                label="Supprimer"
                onClick={() => runAction("delete")}
                pending={pendingAction === "delete"}
                variant="danger"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !info ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-neutral-400" />
            </div>
          ) : info ? (
            <>
              <Section title="Statut">
                <KV label="État" value={`${info.State.Status}${info.State.Running ? " ✅" : " ⛔"}`} />
                {info.State.StartedAt && <KV label="Démarré" value={new Date(info.State.StartedAt).toLocaleString("fr-FR")} />}
                {!info.State.Running && info.State.FinishedAt && (
                  <KV label="Arrêté" value={new Date(info.State.FinishedAt).toLocaleString("fr-FR")} />
                )}
                {info.State.ExitCode !== 0 && (
                  <KV label="Exit code" value={String(info.State.ExitCode)} />
                )}
                {info.State.Error && <KV label="Erreur" value={info.State.Error} />}
              </Section>

              <Section title="Ports">
                {Object.keys(info.NetworkSettings.Ports || {}).length === 0 ? (
                  <p className="text-xs text-neutral-500">Aucun port exposé</p>
                ) : (
                  <div className="space-y-1 font-mono text-xs">
                    {Object.entries(info.NetworkSettings.Ports || {}).map(([key, bindings]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5">{key}</span>
                        {bindings && bindings.length > 0 && (
                          <>
                            <span className="text-neutral-400">→</span>
                            {bindings.map((b, i) => (
                              <span key={i} className="rounded bg-neutral-100 px-1.5 py-0.5">
                                {b.HostIp === "0.0.0.0" ? "" : `${b.HostIp}:`}
                                {b.HostPort}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Variables d'environnement">
                {info.Config.Env.length === 0 ? (
                  <p className="text-xs text-neutral-500">Aucune</p>
                ) : (
                  <div className="space-y-0.5 font-mono text-[11px]">
                    {info.Config.Env.map((e, i) => {
                      const [k, ...rest] = e.split("=")
                      const v = rest.join("=")
                      const sensitive = /password|secret|key|token/i.test(k)
                      return (
                        <div key={i} className="truncate">
                          <span className="text-blue-700">{k}</span>
                          <span className="text-neutral-400">=</span>
                          <span className="text-neutral-700">{sensitive ? "••••••" : v}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Section>

              <Section title={<span className="inline-flex items-center gap-1.5"><Activity size={12} /> Logs (200 dernières lignes)</span>}>
                <pre className="max-h-[50vh] overflow-auto rounded-lg bg-neutral-950 p-3 text-[11px] leading-relaxed text-neutral-100">
                  {logs || "—"}
                </pre>
              </Section>
            </>
          ) : (
            <p className="text-sm text-neutral-500">Container introuvable</p>
          )}
        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">{title}</h3>
      {children}
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-900 text-right">{value}</span>
    </div>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  pending,
  disabled,
  variant,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  pending: boolean
  disabled?: boolean
  variant: "primary" | "default" | "danger"
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending || disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        variant === "primary" && "bg-green-600 text-white hover:bg-green-700",
        variant === "default" && "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
        variant === "danger" && "border border-red-200 bg-white text-red-700 hover:bg-red-50"
      )}
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : icon}
      {label}
    </button>
  )
}
