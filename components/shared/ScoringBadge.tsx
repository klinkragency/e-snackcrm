import { cn } from "@/lib/utils"

const SCORING_STYLES = {
  HOT: "bg-red-100 text-red-700 ring-red-200",
  WARM: "bg-orange-100 text-orange-700 ring-orange-200",
  COLD: "bg-sky-100 text-sky-700 ring-sky-200",
} as const

type Scoring = keyof typeof SCORING_STYLES

type Props = {
  scoring: Scoring
}

export function ScoringBadge({ scoring }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        SCORING_STYLES[scoring],
      )}
    >
      {scoring}
    </span>
  )
}
