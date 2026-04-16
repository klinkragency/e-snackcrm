import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-neutral-200",
        className,
      )}
    />
  )
}

// ─── Card skeleton ─────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <Bone className="mb-4 h-4 w-1/3" />
      <Bone className="mb-2 h-3 w-full" />
      <Bone className="mb-2 h-3 w-2/3" />
      <Bone className="h-3 w-1/2" />
    </div>
  )
}

// ─── Table skeleton ────────────────────────────────────────────────────
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex gap-4 border-b border-neutral-100 px-5 py-3">
        <Bone className="h-3 w-24" />
        <Bone className="h-3 w-32" />
        <Bone className="h-3 w-20" />
        <Bone className="h-3 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-neutral-50 px-5 py-3 last:border-0">
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-32" />
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

// ─── Pipeline skeleton ─────────────────────────────────────────────────
function PipelineSkeleton() {
  return (
    <div className="space-y-4">
      {/* Nav bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Bone className="h-6 w-6 rounded-full" />
            <Bone className="h-3 w-16" />
            {i < 4 && <Bone className="h-0.5 w-8" />}
          </div>
        ))}
      </div>
      {/* Form area */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Bone className="mb-5 h-4 w-1/4" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Bone className="h-10 w-full rounded-xl" />
            <Bone className="h-10 w-full rounded-xl" />
          </div>
          <Bone className="h-10 w-full rounded-xl" />
          <Bone className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Profile skeleton ──────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Bone className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-1/3" />
          <Bone className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Bone className="h-20 rounded-xl" />
        <Bone className="h-20 rounded-xl" />
        <Bone className="h-20 rounded-xl" />
      </div>
    </div>
  )
}

// ─── KPI skeleton ──────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <Bone className="mb-2 h-3 w-1/2" />
          <Bone className="h-7 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────
type Variant = "card" | "table" | "pipeline" | "profile" | "kpi"

type Props = {
  variant: Variant
  className?: string
}

export function LoadingSkeleton({ variant, className }: Props) {
  const content = {
    card: <CardSkeleton />,
    table: <TableSkeleton />,
    pipeline: <PipelineSkeleton />,
    profile: <ProfileSkeleton />,
    kpi: <KpiSkeleton />,
  }[variant]

  return <div className={className}>{content}</div>
}
