import { cn } from "@/lib/utils"
import {
  MessageSquare,
  ArrowRight,
  FileText,
  CreditCard,
  UserPlus,
  AlertTriangle,
  Check,
} from "lucide-react"

type TimelineEntry = {
  id: string
  type: "event" | "comment"
  date: string
  // Event fields
  eventType?: string
  description?: string
  actorName?: string
  // Comment fields
  authorName?: string
  content?: string
}

type Props = {
  entries: TimelineEntry[]
}

const EVENT_ICONS: Record<string, typeof ArrowRight> = {
  step_change: ArrowRight,
  quote_sent: FileText,
  payment_received: CreditCard,
  lead_created: UserPlus,
  status_change: AlertTriangle,
  mockup_validated: Check,
}

const EVENT_COLORS: Record<string, string> = {
  step_change: "bg-blue-100 text-blue-600",
  quote_sent: "bg-amber-100 text-amber-600",
  payment_received: "bg-green-100 text-green-600",
  lead_created: "bg-violet-100 text-violet-600",
  status_change: "bg-red-100 text-red-600",
  mockup_validated: "bg-green-100 text-green-600",
}

export function Timeline({ entries }: Props) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
        Aucun evenement pour le moment.
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {sorted.map((entry, idx) => {
        const isComment = entry.type === "comment"
        const Icon = isComment
          ? MessageSquare
          : EVENT_ICONS[entry.eventType || ""] || ArrowRight
        const colorCls = isComment
          ? "bg-neutral-100 text-neutral-600"
          : EVENT_COLORS[entry.eventType || ""] || "bg-neutral-100 text-neutral-600"

        return (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {idx < sorted.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-neutral-100" />
            )}

            {/* Icon */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                colorCls,
              )}
            >
              <Icon size={14} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              {isComment ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      {entry.authorName}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(entry.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{entry.content}</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-700">
                      {entry.description}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
                    {entry.actorName && <span>{entry.actorName}</span>}
                    <span>
                      {new Date(entry.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
