import { cn } from "@/lib/utils"

type Status = "draft" | "provisioned" | "deployed" | "paused"

const LABELS: Record<Status, string> = {
  draft: "Brouillon",
  provisioned: "Configuré",
  deployed: "Déployé",
  paused: "En pause",
}

const STYLES: Record<Status, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  provisioned: "bg-blue-50 text-blue-700",
  deployed: "bg-green-50 text-green-700",
  paused: "bg-amber-50 text-amber-700",
}

export function ClientStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  )
}
