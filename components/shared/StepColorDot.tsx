import { cn } from "@/lib/utils"

const STEP_COLORS = {
  A: { dot: "bg-zinc-500", label: "text-zinc-700" },
  B: { dot: "bg-blue-500", label: "text-blue-700" },
  C: { dot: "bg-amber-500", label: "text-amber-700" },
  D: { dot: "bg-violet-500", label: "text-violet-700" },
  E: { dot: "bg-green-500", label: "text-green-700" },
} as const

type Step = keyof typeof STEP_COLORS

const STEP_LABELS: Record<Step, string> = {
  A: "Contact",
  B: "Qualification",
  C: "Devis",
  D: "Maquette",
  E: "Paiement",
}

type Props = {
  step: Step
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

const SIZE_CLS = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const

export function StepColorDot({ step, size = "md", showLabel = false }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("shrink-0 rounded-full", STEP_COLORS[step].dot, SIZE_CLS[size])}
      />
      {showLabel && (
        <span
          className={cn(
            "text-xs font-semibold",
            STEP_COLORS[step].label,
          )}
        >
          {STEP_LABELS[step]}
        </span>
      )}
    </span>
  )
}
