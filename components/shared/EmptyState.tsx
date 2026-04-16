import { cn } from "@/lib/utils"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

type Props = {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
        <Icon size={22} className="text-neutral-400" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
