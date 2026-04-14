"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Plus, Loader2, Box, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContainerDrawer } from "@/components/container-drawer"
import { NewContainerDialog } from "@/components/new-container-dialog"

export type ContainerSummary = {
  id: string
  name: string
  image: string
  state: string
  status: string
  createdAt: number
  ports: { privatePort: number; publicPort?: number; type: string }[]
  clientId: string | null
  clientSlug: string | null
}

export function ContainersGrid({ canWrite }: { canWrite: boolean }) {
  const [containers, setContainers] = useState<ContainerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/containers", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Erreur")
      }
      const { containers } = (await res.json()) as { containers: ContainerSummary[] }
      setContainers(containers)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [refresh])

  const running = containers.filter((c) => c.state === "running").length
  const stopped = containers.filter((c) => c.state !== "running").length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Containers</h1>
          <p className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" /> {running} running
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> {stopped} stopped
            </span>
            {!canWrite && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-700">
                Lecture seule
              </span>
            )}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <Plus size={16} />
            Nouveau container
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && containers.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : containers.length === 0 ? (
        <EmptyState canWrite={canWrite} onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {containers.map((c) => (
            <ContainerCard key={c.id} container={c} onClick={() => setSelectedId(c.id)} />
          ))}
        </div>
      )}

      <ContainerDrawer
        containerId={selectedId}
        canWrite={canWrite}
        onClose={() => setSelectedId(null)}
        onAction={refresh}
      />

      <NewContainerDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={refresh} />
    </div>
  )
}

function ContainerCard({ container, onClick }: { container: ContainerSummary; onClick: () => void }) {
  const isRunning = container.state === "running"
  const isProblematic = container.state === "restarting" || container.state === "paused"

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md">
      <button onClick={onClick} className="flex items-start justify-between gap-3 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{container.name}</p>
          <p className="truncate text-xs text-neutral-500">{container.image}</p>
        </div>
        <div
          className={cn(
            "mt-1 h-3 w-3 shrink-0 rounded-full",
            isRunning && "bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]",
            !isRunning && !isProblematic && "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
            isProblematic && "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
          )}
        />
      </button>
      <button onClick={onClick} className="text-left text-[11px] text-neutral-500">
        {container.status}
      </button>
      <div className="flex flex-wrap items-center gap-1">
        {container.clientSlug && container.clientId && (
          <Link
            href={`/clients/${container.clientId}`}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Tag size={9} />#{container.clientSlug}
          </Link>
        )}
        {container.ports.slice(0, 3).map((p, i) => (
          <span
            key={i}
            className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-700"
          >
            {p.publicPort ? `${p.publicPort}→` : ""}
            {p.privatePort}/{p.type}
          </span>
        ))}
        {container.ports.length > 3 && (
          <span className="text-[10px] text-neutral-500">+{container.ports.length - 3}</span>
        )}
      </div>
    </div>
  )
}

function EmptyState({ canWrite, onCreate }: { canWrite: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white/50 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
        <Box size={20} className="text-neutral-400" />
      </div>
      <p className="text-sm font-medium text-neutral-900">Aucun container managé</p>
      {canWrite && (
        <>
          <p className="mt-1 text-xs text-neutral-500">
            Lance ton premier container depuis le dashboard.
          </p>
          <button
            onClick={onCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <Plus size={13} />
            Nouveau container
          </button>
        </>
      )}
    </div>
  )
}
