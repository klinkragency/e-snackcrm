import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/server"
import {
  deployClientInstanceStream,
  stopClientInstance,
  type DeployEvent,
} from "@/lib/instance-deploy"

export const maxDuration = 600
export const dynamic = "force-dynamic"

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
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: DeployEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      try {
        for await (const event of deployClientInstanceStream(id)) {
          enqueue(event)
        }
      } catch (err) {
        enqueue({
          type: "error",
          message: err instanceof Error ? err.message : "Erreur de déploiement",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
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
