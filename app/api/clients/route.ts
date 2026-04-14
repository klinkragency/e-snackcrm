import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db, clients, clientConfig } from "@/lib/db"
import { createClientSchema } from "@/lib/validation"
import { generateClientSecrets } from "@/lib/secrets"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const parsed = createClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const input = parsed.data

  const existing = await db.select().from(clients).where(eq(clients.slug, input.slug)).limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ error: "Slug déjà utilisé" }, { status: 409 })
  }

  const secrets = generateClientSecrets()

  const [created] = await db
    .insert(clients)
    .values({
      slug: input.slug,
      name: input.name,
      domain: input.domain,
      ownerEmail: input.ownerEmail,
      ownerName: input.ownerName,
      ownerPhone: input.ownerPhone || null,
      notes: input.notes || null,
      status: "draft",
    })
    .returning()

  await db.insert(clientConfig).values({
    clientId: created.id,
    initialAdminEmail: input.initialAdminEmail,
    initialAdminPassword: input.initialAdminPassword,
    initialAdminName: input.initialAdminName,
    initialRestaurantName: input.initialRestaurantName,
    initialRestaurantSlug: input.initialRestaurantSlug,
    mollieApiKey: input.mollieApiKey || null,
    resendApiKey: input.resendApiKey || null,
    emailFromAddress: input.emailFromAddress,
    ...secrets,
  })

  return NextResponse.json({ id: created.id }, { status: 201 })
}
