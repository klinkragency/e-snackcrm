import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"
import { GradeBadge } from "@/components/shared/GradeBadge"

type Grade = "STARTER" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND"

type GradeRequirement = {
  grade: Grade
  dealsRequired: number
  recruitsRequired: number
}

const GRADE_REQUIREMENTS: GradeRequirement[] = [
  { grade: "STARTER", dealsRequired: 0, recruitsRequired: 0 },
  { grade: "SILVER", dealsRequired: 5, recruitsRequired: 1 },
  { grade: "GOLD", dealsRequired: 15, recruitsRequired: 3 },
  { grade: "PLATINUM", dealsRequired: 30, recruitsRequired: 5 },
  { grade: "DIAMOND", dealsRequired: 50, recruitsRequired: 10 },
]

type Props = {
  currentGrade: Grade
  dealsCount: number
  recruitsCount: number
}

export function GradeProgress({ currentGrade, dealsCount, recruitsCount }: Props) {
  const currentIdx = GRADE_REQUIREMENTS.findIndex((g) => g.grade === currentGrade)
  const nextGrade = currentIdx < GRADE_REQUIREMENTS.length - 1
    ? GRADE_REQUIREMENTS[currentIdx + 1]
    : null

  const isMaxGrade = !nextGrade

  const dealsProgress = nextGrade
    ? Math.min(100, Math.round((dealsCount / nextGrade.dealsRequired) * 100))
    : 100

  const recruitsProgress = nextGrade
    ? Math.min(100, Math.round((recruitsCount / nextGrade.recruitsRequired) * 100))
    : 100

  const dealsBlocking = nextGrade ? dealsCount < nextGrade.dealsRequired : false
  const recruitsBlocking = nextGrade ? recruitsCount < nextGrade.recruitsRequired : false

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Progression de grade
        </h3>
        <GradeBadge grade={currentGrade} size="md" />
      </div>

      {isMaxGrade ? (
        <div className="rounded-xl bg-gradient-to-r from-cyan-50 to-violet-50 p-4 text-center">
          <p className="text-sm font-semibold text-neutral-700">
            Grade maximum atteint !
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Vous etes au sommet de la hierarchie.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-neutral-500">Prochain grade :</span>
            <GradeBadge grade={nextGrade!.grade} size="sm" />
          </div>

          {/* Deals progress */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700">
                Deals conclus
              </span>
              <span className="text-xs text-neutral-500">
                {dealsCount} / {nextGrade!.dealsRequired}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  dealsBlocking ? "bg-amber-400" : "bg-green-500",
                )}
                style={{ width: `${dealsProgress}%` }}
              />
            </div>
            {dealsBlocking && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                <Lock size={12} />
                <span>
                  {nextGrade!.dealsRequired - dealsCount} deal{nextGrade!.dealsRequired - dealsCount > 1 ? "s" : ""} restant{nextGrade!.dealsRequired - dealsCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Recruits progress */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700">
                Filleuls recrutes
              </span>
              <span className="text-xs text-neutral-500">
                {recruitsCount} / {nextGrade!.recruitsRequired}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  recruitsBlocking ? "bg-amber-400" : "bg-green-500",
                )}
                style={{ width: `${recruitsProgress}%` }}
              />
            </div>
            {recruitsBlocking && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                <Lock size={12} />
                <span>
                  {nextGrade!.recruitsRequired - recruitsCount} filleul{nextGrade!.recruitsRequired - recruitsCount > 1 ? "s" : ""} restant{nextGrade!.recruitsRequired - recruitsCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Dynamic blocking message */}
          {(dealsBlocking || recruitsBlocking) && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-700">
                {dealsBlocking && recruitsBlocking
                  ? "Vous devez augmenter vos deals et recruter plus de filleuls pour atteindre le prochain grade."
                  : dealsBlocking
                    ? "Continuez a conclure des deals pour debloquer le prochain grade."
                    : "Recrutez plus de filleuls pour debloquer le prochain grade."}
              </p>
            </div>
          )}

          {!dealsBlocking && !recruitsBlocking && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3">
              <p className="text-xs font-semibold text-green-700">
                Toutes les conditions sont remplies ! Votre grade sera mis a jour prochainement.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
