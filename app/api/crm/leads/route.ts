import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { leads, timelineEvents, user } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"

const createLeadSchema = z.object({
  clientFirstname: z.string().min(1, "Prenom requis"),
  clientLastname: z.string().min(1, "Nom requis"),
  clientEmail: z.string().email("Email invalide"),
  clientPhone: z.string().min(1, "Telephone requis"),
  clientCity: z.string().optional().default(""),
  clientCompany: z.string().optional().default(""),
  source: z.string().optional().default(""),
  initialNote: z.string().optional().default(""),
})

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  // Verify user is affiliate or admin
  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!dbUser || (dbUser.role !== "affiliate" && dbUser.role !== "admin")) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
  }

  const parsed = createLeadSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Donnees invalides"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const data = parsed.data
  const now = new Date()

  const [newLead] = await db
    .insert(leads)
    .values({
      affiliateId: session.user.id,
      step: "A",
      status: "ACTIVE",
      clientFirstname: data.clientFirstname,
      clientLastname: data.clientLastname,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      clientCity: data.clientCity || null,
      clientCompany: data.clientCompany || null,
      source: data.source || null,
      initialNote: data.initialNote || null,
      stepAAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: leads.id })

  // Create timeline event
  await db.insert(timelineEvents).values({
    leadId: newLead.id,
    type: "lead_created",
    description: `Lead cree en etape A`,
    actorId: session.user.id,
  })

  return NextResponse.json({ id: newLead.id }, { status: 201 })
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!dbUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  let userLeads
  if (dbUser.role === "admin") {
    userLeads = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.updatedAt))
  } else {
    userLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.affiliateId, session.user.id))
      .orderBy(desc(leads.updatedAt))
  }

  return NextResponse.json({ leads: userLeads })
}
