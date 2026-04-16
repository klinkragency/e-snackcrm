import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const STEPS = [
  { key: "A", label: "Contact", color: "bg-zinc-500", ring: "ring-zinc-200" },
  { key: "B", label: "Qualification", color: "bg-blue-500", ring: "ring-blue-200" },
  { key: "C", label: "Devis", color: "bg-amber-500", ring: "ring-amber-200" },
  { key: "D", label: "Maquette", color: "bg-violet-500", ring: "ring-violet-200" },
  { key: "E", label: "Paiement", color: "bg-green-500", ring: "ring-green-200" },
] as const

type Step = "A" | "B" | "C" | "D" | "E"

const STEP_ORDER: Step[] = ["A", "B", "C", "D", "E"]

type Props = {
  currentStep: Step
  onStepClick?: (step: Step) => void
}

export function PipelineNav({ currentStep, onStepClick }: Props) {
  const currentIdx = STEP_ORDER.indexOf(currentStep)

  return (
    <nav className="flex items-center gap-1 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent = step.key === currentStep
        const isClickable = onStepClick && idx <= currentIdx

        return (
          <div key={step.key} className="flex items-center gap-1">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.key)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                isCurrent && "bg-neutral-900 text-white",
                isCompleted && "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                !isCurrent && !isCompleted && "text-neutral-400",
                isClickable && "cursor-pointer",
                !isClickable && "cursor-default",
              )}
            >
              {isCompleted ? (
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", step.color)}>
                  <Check size={12} className="text-white" />
                </span>
              ) : (
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isCurrent ? step.color : "bg-neutral-300",
                  )}
                />
              )}
              {step.label}
            </button>

            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-6",
                  idx < currentIdx ? "bg-neutral-400" : "bg-neutral-200",
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
