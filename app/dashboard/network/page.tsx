import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const GRADE_COLORS: Record<string, string> = {
  STARTER: "bg-neutral-100 text-neutral-700",
  SILVER: "bg-neutral-200 text-neutral-800",
  GOLD: "bg-amber-100 text-amber-800",
  PLATINUM: "bg-indigo-100 text-indigo-800",
  DIAMOND: "bg-purple-100 text-purple-800",
}

interface Recruit {
  id: string
  name: string
  email: string
  grade: string
  isActive: boolean
  createdAt: Date
}

export default async function NetworkPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  // N1 recruits
  const n1Recruits: Recruit[] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      grade: user.grade,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.parentId, session.user.id))

  // N2 recruits (recruits of recruits)
  const n2Map: Record<string, Recruit[]> = {}
  for (const recruit of n1Recruits) {
    const n2: Recruit[] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.parentId, recruit.id))

    if (n2.length > 0) {
      n2Map[recruit.id] = n2
    }
  }

  const totalN2 = Object.values(n2Map).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mon reseau</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Filleuls N1
          </p>
          <p className="mt-1 text-2xl font-bold">{n1Recruits.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Filleuls N2
          </p>
          <p className="mt-1 text-2xl font-bold">{totalN2}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total reseau
          </p>
          <p className="mt-1 text-2xl font-bold">{n1Recruits.length + totalN2}</p>
        </div>
      </div>

      {/* N1 list */}
      {n1Recruits.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-500">Aucun filleul pour le moment.</p>
          <p className="mt-1 text-xs text-neutral-400">
            Partagez votre code de parrainage pour recruter des affilies.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {n1Recruits.map((recruit) => (
            <div
              key={recruit.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold">
                    {recruit.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{recruit.name}</p>
                    <p className="text-xs text-neutral-500">{recruit.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${GRADE_COLORS[recruit.grade] ?? GRADE_COLORS.STARTER}`}
                  >
                    {recruit.grade}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${recruit.isActive ? "bg-emerald-500" : "bg-neutral-300"}`}
                  />
                </div>
              </div>

              {/* N2 sub-list */}
              {n2Map[recruit.id] && n2Map[recruit.id].length > 0 && (
                <div className="mt-3 ml-12 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Filleuls N2
                  </p>
                  {n2Map[recruit.id].map((n2) => (
                    <div
                      key={n2.id}
                      className="flex items-center justify-between rounded-lg bg-neutral-50 p-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{n2.name}</span>
                        <span className="text-neutral-400">{n2.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${GRADE_COLORS[n2.grade] ?? GRADE_COLORS.STARTER}`}
                        >
                          {n2.grade}
                        </span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${n2.isActive ? "bg-emerald-500" : "bg-neutral-300"}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
