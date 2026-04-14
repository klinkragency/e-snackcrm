import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db, managedContainers, clients } from "@/lib/db"
import { getCurrentUser, requireAdmin } from "@/lib/auth/server"
import { listManagedContainers, createAndStartContainer } from "@/lib/docker"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Pull DB rows with associated client slug/id so we can badge each card
    const rows = await db
      .select({
        dockerName: managedContainers.dockerName,
        clientId: managedContainers.clientId,
        clientSlug: clients.slug,
      })
      .from(managedContainers)
      .leftJoin(clients, eq(managedContainers.clientId, clients.id))

    const containers = await listManagedContainers(rows)
    return NextResponse.json({ containers })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list containers" },
      { status: 500 }
    )
  }
}

const createSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Lettres, chiffres, _ . - uniquement"),
  image: z.string().min(1),
  envVars: z.record(z.string(), z.string()).optional(),
  portMappings: z
    .array(
      z.object({
        host: z.number().int().min(1).max(65535),
        container: z.number().int().min(1).max(65535),
        protocol: z.enum(["tcp", "udp"]).optional(),
      })
    )
    .optional(),
})

export async function POST(request: NextRequest) {
  let currentUser
  try {
    currentUser = await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const dockerId = await createAndStartContainer(parsed.data)

    await db.insert(managedContainers).values({
      dockerName: parsed.data.name,
      image: parsed.data.image,
      createdBy: currentUser.id,
    })

    return NextResponse.json({ id: dockerId }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create container" },
      { status: 500 }
    )
  }
}
