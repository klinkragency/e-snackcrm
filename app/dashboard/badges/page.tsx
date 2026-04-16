import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Lock } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { badges, userBadges } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const CATEGORY_LABELS: Record<string, string> = {
  PREMIERS_PAS: "Premiers pas",
  PERFORMANCE: "Performance",
  RESEAU: "Reseau",
  MANUEL: "Manuel",
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: "border-neutral-300 bg-neutral-50",
  RARE: "border-blue-300 bg-blue-50",
  EPIC: "border-purple-300 bg-purple-50",
  LEGENDARY: "border-amber-300 bg-amber-50",
}

const RARITY_TEXT: Record<string, string> = {
  COMMON: "text-neutral-600",
  RARE: "text-blue-700",
  EPIC: "text-purple-700",
  LEGENDARY: "text-amber-700",
}

export default async function BadgesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const allBadges = await db.select().from(badges)
  const obtainedBadges = await db
    .select({ badgeId: userBadges.badgeId, obtainedAt: userBadges.obtainedAt })
    .from(userBadges)
    .where(eq(userBadges.userId, session.user.id))

  const obtainedIds = new Set(obtainedBadges.map((b) => b.badgeId))

  // Group by category
  const grouped: Record<string, typeof allBadges> = {}
  for (const badge of allBadges) {
    if (!grouped[badge.category]) grouped[badge.category] = []
    grouped[badge.category].push(badge)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes badges</h1>
        <p className="text-sm text-neutral-500">
          {obtainedIds.size} / {allBadges.length} obtenus
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-500">Aucun badge disponible pour le moment.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryBadges]) => (
          <div key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categoryBadges.map((badge) => {
                const obtained = obtainedIds.has(badge.id)
                return (
                  <div
                    key={badge.id}
                    className={`relative rounded-2xl border p-4 shadow-sm transition-all ${
                      obtained
                        ? RARITY_COLORS[badge.rarity] ?? RARITY_COLORS.COMMON
                        : "border-neutral-200 bg-white opacity-50"
                    }`}
                  >
                    {!obtained && (
                      <div className="absolute right-3 top-3">
                        <Lock size={14} className="text-neutral-400" />
                      </div>
                    )}
                    <div
                      className="mb-2 h-10 w-10"
                      dangerouslySetInnerHTML={{ __html: badge.iconSvg }}
                    />
                    <p className="text-sm font-semibold">{badge.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{badge.description}</p>
                    <p
                      className={`mt-2 text-[10px] font-semibold uppercase tracking-wider ${
                        obtained
                          ? RARITY_TEXT[badge.rarity] ?? RARITY_TEXT.COMMON
                          : "text-neutral-400"
                      }`}
                    >
                      {badge.rarity}
                    </p>
                    {!obtained && (
                      <p className="mt-1 text-[10px] text-neutral-400">
                        {badge.conditionText}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
