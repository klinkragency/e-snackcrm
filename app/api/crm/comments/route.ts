import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { comments, leads, timelineEvents, user } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const createCommentSchema = z.object({
  leadId: z.string().min(1, "ID du lead requis"),
  content: z.string().min(1, "Commentaire requis"),
})

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
  }

  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Donnees invalides"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const data = parsed.data

  // Check user role
  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!dbUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  // Verify lead access: affiliate can only comment on their own leads, admin can comment on any
  if (dbUser.role !== "admin") {
    const [lead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.id, data.leadId), eq(leads.affiliateId, session.user.id)))
      .limit(1)

    if (!lead) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 })
    }
  } else {
    const [lead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.id, data.leadId))
      .limit(1)

    if (!lead) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 })
    }
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      leadId: data.leadId,
      authorId: session.user.id,
      content: data.content,
    })
    .returning({ id: comments.id })

  // Timeline event
  await db.insert(timelineEvents).values({
    leadId: data.leadId,
    type: "comment_added",
    description: `Commentaire ajoute par ${session.user.name}`,
    actorId: session.user.id,
  })

  return NextResponse.json({ id: newComment.id }, { status: 201 })
}
