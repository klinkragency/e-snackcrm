import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { getContainerLogs } from "@/lib/docker"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const url = new URL(request.url)
  const tail = Math.min(1000, Math.max(10, parseInt(url.searchParams.get("tail") || "100", 10) || 100))

  try {
    const logs = await getContainerLogs(id, tail)
    return NextResponse.json({ logs })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read logs" },
      { status: 500 }
    )
  }
}
