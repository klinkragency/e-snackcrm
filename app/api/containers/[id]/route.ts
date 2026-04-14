import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db, managedContainers } from "@/lib/db"
import { requireAdmin } from "@/lib/auth/server"
import {
  getContainerInfo,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
} from "@/lib/docker"

type Action = "start" | "stop" | "restart"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const info = await getContainerInfo(id)
    return NextResponse.json({ container: info })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const action = body.action as Action | undefined
  if (!action || !["start", "stop", "restart"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  try {
    if (action === "start") await startContainer(id)
    else if (action === "stop") await stopContainer(id)
    else if (action === "restart") await restartContainer(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : `Failed to ${action} container` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  try {
    const info = await getContainerInfo(id)
    const name = info.Name.replace(/^\//, "")
    await removeContainer(id)
    // Best-effort cleanup of our DB row (matched by docker name)
    await db.delete(managedContainers).where(eq(managedContainers.dockerName, name))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete container" },
      { status: 500 }
    )
  }
}
