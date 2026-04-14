import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/server"
import { deployClientInstance, stopClientInstance } from "@/lib/instance-deploy"

export const maxDuration = 600 // a fresh build + pull can easily hit 2-3 min

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 })
  }

  const { id } = await params
  try {
    const result = await deployClientInstance(id)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to deploy instance" },
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
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 })
  }

  const { id } = await params
  try {
    await stopClientInstance(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to stop instance" },
      { status: 500 }
    )
  }
}
