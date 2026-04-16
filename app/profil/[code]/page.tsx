import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { user, userBadges, badges, leads } from "@/lib/db/schema"
import { eq, and, count } from "drizzle-orm"

const GRADE_COLORS: Record<string, string> = {
  STARTER: "bg-neutral-100 text-neutral-700",
  SILVER: "bg-neutral-200 text-neutral-800",
  GOLD: "bg-amber-100 text-amber-800",
  PLATINUM: "bg-indigo-100 text-indigo-800",
  DIAMOND: "bg-purple-100 text-purple-800",
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      grade: user.grade,
      bio: user.bio,
      city: user.city,
      isActive: user.isActive,
      parrainageCode: user.parrainageCode,
    })
    .from(user)
    .where(eq(user.parrainageCode, code))
    .limit(1)

  if (!profile || !profile.isActive) notFound()

  const displayName = profile.firstName
    ? `${profile.firstName} ${profile.lastName ?? ""}`.trim()
    : profile.name

  // Badges
  const profileBadges = await db
    .select({
      name: badges.name,
      rarity: badges.rarity,
      iconSvg: badges.iconSvg,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, profile.id))

  // Stats
  const [dealCount] = await db
    .select({ value: count() })
    .from(leads)
    .where(and(eq(leads.affiliateId, profile.id), eq(leads.step, "E")))

  const [recruitCount] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.parentId, profile.id))

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          {/* Avatar */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-3xl font-bold text-neutral-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Name & grade */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="mt-2">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${GRADE_COLORS[profile.grade] ?? GRADE_COLORS.STARTER}`}
              >
                {profile.grade}
              </span>
            </div>
            {profile.city && (
              <p className="mt-2 text-sm text-neutral-500">{profile.city}</p>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-center text-sm text-neutral-600">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-neutral-50 p-4 text-center">
              <p className="text-2xl font-bold">{dealCount?.value ?? 0}</p>
              <p className="text-xs text-neutral-500">Deals conclus</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4 text-center">
              <p className="text-2xl font-bold">{recruitCount?.value ?? 0}</p>
              <p className="text-xs text-neutral-500">Filleuls</p>
            </div>
          </div>

          {/* Badges */}
          {profileBadges.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Badges obtenus
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {profileBadges.map((badge, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-1.5"
                    title={badge.name}
                  >
                    <div
                      className="h-4 w-4"
                      dangerouslySetInnerHTML={{ __html: badge.iconSvg }}
                    />
                    <span className="text-xs font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-8">
            <Link
              href={`/join/${code}`}
              className="block w-full rounded-full bg-black py-3 text-center text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              Rejoindre mon equipe
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
