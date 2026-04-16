import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { badges, userBadges, user } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"

const CATEGORY_LABELS: Record<string, string> = {
  PREMIERS_PAS: "Premiers pas",
  PERFORMANCE: "Performance",
  RESEAU: "Reseau",
  MANUEL: "Manuel",
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: "border-neutral-300",
  RARE: "border-blue-300",
  EPIC: "border-purple-300",
  LEGENDARY: "border-amber-300",
}

export default async function AdminBadgesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (dbUser?.role !== "admin") redirect("/dashboard")

  const allBadges = await db.select().from(badges)

  // Count how many users have each badge
  const badgeCounts = await db
    .select({ badgeId: userBadges.badgeId, value: count() })
    .from(userBadges)
    .groupBy(userBadges.badgeId)

  const countMap: Record<string, number> = {}
  for (const row of badgeCounts) {
    countMap[row.badgeId] = row.value
  }

  // Group by category
  const grouped: Record<string, typeof allBadges> = {}
  for (const badge of allBadges) {
    if (!grouped[badge.category]) grouped[badge.category] = []
    grouped[badge.category].push(badge)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catalogue Badges</h1>
        <p className="text-sm text-neutral-500">{allBadges.length} badges</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-500">Aucun badge configure.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryBadges]) => (
          <div key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {CATEGORY_LABELS[category] ?? category} ({categoryBadges.length})
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categoryBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${RARITY_COLORS[badge.rarity] ?? "border-neutral-200"}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="mb-2 h-10 w-10"
                      dangerouslySetInnerHTML={{ __html: badge.iconSvg }}
                    />
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold">
                      {countMap[badge.id] ?? 0} attribues
                    </span>
                  </div>
                  <p className="text-sm font-semibold">{badge.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{badge.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {badge.rarity}
                    </span>
                    {badge.isManual && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Manuel
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
