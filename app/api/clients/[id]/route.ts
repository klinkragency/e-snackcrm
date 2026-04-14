import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db, clients, clientConfig } from "@/lib/db"
import { updateClientSchema } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = updateClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const input = parsed.data

  const clientFields: Record<string, unknown> = {}
  if (input.name !== undefined) clientFields.name = input.name
  if (input.slug !== undefined) clientFields.slug = input.slug
  if (input.domain !== undefined) clientFields.domain = input.domain
  if (input.ownerEmail !== undefined) clientFields.ownerEmail = input.ownerEmail
  if (input.ownerName !== undefined) clientFields.ownerName = input.ownerName
  if (input.ownerPhone !== undefined) clientFields.ownerPhone = input.ownerPhone || null
  if (input.notes !== undefined) clientFields.notes = input.notes || null
  if (Object.keys(clientFields).length > 0) {
    clientFields.updatedAt = new Date()
    await db.update(clients).set(clientFields).where(eq(clients.id, id))
  }

  const configFields: Record<string, unknown> = {}
  if (input.initialAdminEmail !== undefined) configFields.initialAdminEmail = input.initialAdminEmail
  if (input.initialAdminPassword !== undefined) configFields.initialAdminPassword = input.initialAdminPassword
  if (input.initialAdminName !== undefined) configFields.initialAdminName = input.initialAdminName
  if (input.initialRestaurantName !== undefined) configFields.initialRestaurantName = input.initialRestaurantName
  if (input.initialRestaurantSlug !== undefined) configFields.initialRestaurantSlug = input.initialRestaurantSlug
  if (input.mollieApiKey !== undefined) configFields.mollieApiKey = input.mollieApiKey || null
  if (input.resendApiKey !== undefined) configFields.resendApiKey = input.resendApiKey || null
  if (input.emailFromAddress !== undefined) configFields.emailFromAddress = input.emailFromAddress
  if (Object.keys(configFields).length > 0) {
    configFields.updatedAt = new Date()
    await db.update(clientConfig).set(configFields).where(eq(clientConfig.clientId, id))
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(clients).where(eq(clients.id, id))
  return NextResponse.json({ ok: true })
}
