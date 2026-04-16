import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { JoinForm } from "./JoinForm"

const GRADE_COLORS: Record<string, string> = {
  STARTER: "bg-neutral-100 text-neutral-700",
  SILVER: "bg-neutral-200 text-neutral-800",
  GOLD: "bg-amber-100 text-amber-800",
  PLATINUM: "bg-indigo-100 text-indigo-800",
  DIAMOND: "bg-purple-100 text-purple-800",
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const [sponsor] = await db
    .select({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      grade: user.grade,
      bio: user.bio,
      city: user.city,
      isActive: user.isActive,
    })
    .from(user)
    .where(eq(user.parrainageCode, code))
    .limit(1)

  if (!sponsor || !sponsor.isActive) notFound()

  const displayName = sponsor.firstName
    ? `${sponsor.firstName} ${sponsor.lastName ?? ""}`.trim()
    : sponsor.name

  return (
    <div className="flex min-h-screen">
      {/* Left: Sponsor profile */}
      <div className="hidden w-1/2 items-center justify-center bg-neutral-900 p-12 text-white lg:flex">
        <div className="max-w-md">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold">{displayName}</h1>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${GRADE_COLORS[sponsor.grade] ?? GRADE_COLORS.STARTER}`}
          >
            {sponsor.grade}
          </span>
          {sponsor.city && (
            <p className="mt-3 text-sm text-neutral-400">{sponsor.city}</p>
          )}
          {sponsor.bio && (
            <p className="mt-4 text-neutral-300">{sponsor.bio}</p>
          )}
          <div className="mt-8 rounded-xl bg-white/5 p-4">
            <p className="text-xs text-neutral-400">
              Vous avez ete invite par {displayName} a rejoindre le programme
              d&apos;affiliation e-SnackCRM. Remplissez le formulaire pour commencer.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Join form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile sponsor info */}
          <div className="mb-6 lg:hidden">
            <p className="text-sm text-neutral-500">
              Invite par <strong>{displayName}</strong>
            </p>
          </div>

          <h2 className="mb-1 text-2xl font-bold">Rejoindre e-SnackCRM</h2>
          <p className="mb-6 text-sm text-neutral-500">
            Creez votre compte affilie et commencez a generer des commissions.
          </p>

          <JoinForm sponsorCode={code} />
        </div>
      </div>
    </div>
  )
}
