import { cn } from "@/lib/utils"

const GRADE_STYLES = {
  STARTER: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  SILVER: "bg-blue-100 text-blue-700 ring-blue-200",
  GOLD: "bg-amber-100 text-amber-700 ring-amber-200",
  PLATINUM: "bg-violet-100 text-violet-700 ring-violet-200",
  DIAMOND: "bg-cyan-100 text-cyan-700 ring-cyan-200",
} as const

type Grade = keyof typeof GRADE_STYLES

type Props = {
  grade: Grade
  size?: "sm" | "md" | "lg"
}

const SIZE_CLS = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
} as const

export function GradeBadge({ grade, size = "md" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset",
        GRADE_STYLES[grade],
        SIZE_CLS[size],
      )}
    >
      {grade}
    </span>
  )
}
