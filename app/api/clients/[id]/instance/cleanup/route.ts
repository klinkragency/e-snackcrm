import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { rm } from "node:fs/promises"
import path from "node:path"
import { db, clients, managedContainers } from "@/lib/db"
import { requireAdmin } from "@/lib/auth/server"
import { forceCleanupProject } from "@/lib/instance-deploy"

const CLIENTS_DIR = process.env.CLIENTS_DIR || "/srv/clients"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const project = client.composeProject || `esnack-${client.slug}`

  try {
    const removed = await forceCleanupProject(project)

    try {
      await rm(path.join(CLIENTS_DIR, client.slug), { recursive: true, force: true })
    } catch {}

    await db.delete(managedContainers).where(eq(managedContainers.clientId, id))
    await db
      .update(clients)
      .set({
        publicUrl: null,
        composeProject: null,
        ngrokContainerId: null,
        status: "provisioned",
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))

    return NextResponse.json({ ok: true, removed })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cleanup failed" },
      { status: 500 }
    )
  }
}
