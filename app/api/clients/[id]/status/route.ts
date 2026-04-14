import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db, clients } from "@/lib/db"
import { requireAdmin } from "@/lib/auth/server"

const statusSchema = z.object({
  status: z.enum(["draft", "provisioned", "deployed", "paused"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const update: Record<string, unknown> = {
    status: parsed.data.status,
    updatedAt: new Date(),
  }
  if (parsed.data.status === "deployed") {
    update.deployedAt = new Date()
  }

  await db.update(clients).set(update).where(eq(clients.id, id))
  return NextResponse.json({ ok: true })
}
