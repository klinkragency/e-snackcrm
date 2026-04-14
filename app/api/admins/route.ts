import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db, user } from "@/lib/db"

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const existing = await db.select().from(user).where(eq(user.email, parsed.data.email)).limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email déjà autorisé" }, { status: 409 })
  }

  await db.insert(user).values({
    id: randomUUID(),
    email: parsed.data.email,
    name: parsed.data.name,
    emailVerified: true,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await db.delete(user).where(eq(user.id, id))
  return NextResponse.json({ ok: true })
}
