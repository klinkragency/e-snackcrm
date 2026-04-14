"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Check, Pause, Play } from "lucide-react"

type Status = "draft" | "provisioned" | "deployed" | "paused"

export function ClientStatusActions({ clientId, currentStatus }: { clientId: string; currentStatus: Status }) {
  const router = useRouter()
  const [pending, setPending] = useState<Status | null>(null)

  const transition = async (next: Status) => {
    setPending(next)
    try {
      const res = await fetch(`/api/clients/${clientId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error("Échec de la mise à jour du statut")
      toast.success("Statut mis à jour")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus !== "deployed" && (
        <ActionBtn onClick={() => transition("deployed")} pending={pending === "deployed"} icon={<Check size={12} />}>
          Marquer déployé
        </ActionBtn>
      )}
      {currentStatus === "deployed" && (
        <ActionBtn onClick={() => transition("paused")} pending={pending === "paused"} icon={<Pause size={12} />}>
          Mettre en pause
        </ActionBtn>
      )}
      {currentStatus === "paused" && (
        <ActionBtn onClick={() => transition("deployed")} pending={pending === "deployed"} icon={<Play size={12} />}>
          Réactiver
        </ActionBtn>
      )}
    </div>
  )
}

function ActionBtn({
  onClick,
  pending,
  icon,
  children,
}: {
  onClick: () => void
  pending: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
    >
      {pending ? <Loader2 size={12} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
