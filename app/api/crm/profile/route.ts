import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  iban: z.string().optional(),
})

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const [profile] = await db
    .select({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      city: user.city,
      bio: user.bio,
      iban: user.iban,
      email: user.email,
      grade: user.grade,
      parrainageCode: user.parrainageCode,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 })
  }

  return NextResponse.json({ profile })
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Donnees invalides"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const data = parsed.data
  const updates: Record<string, string | null> = {}

  if (data.firstName !== undefined) updates.firstName = data.firstName || null
  if (data.lastName !== undefined) updates.lastName = data.lastName || null
  if (data.phone !== undefined) updates.phone = data.phone || null
  if (data.city !== undefined) updates.city = data.city || null
  if (data.bio !== undefined) updates.bio = data.bio || null
  if (data.iban !== undefined) updates.iban = data.iban || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune modification" }, { status: 400 })
  }

  // Also update the name if firstName/lastName changed
  if (data.firstName !== undefined || data.lastName !== undefined) {
    const [current] = await db
      .select({ firstName: user.firstName, lastName: user.lastName })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const newFirst = data.firstName ?? current?.firstName ?? ""
    const newLast = data.lastName ?? current?.lastName ?? ""
    const fullName = `${newFirst} ${newLast}`.trim()
    if (fullName) {
      updates.name = fullName
    }
  }

  await db
    .update(user)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  return NextResponse.json({ success: true })
}
