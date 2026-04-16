import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { payments, auditLog, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const markPaidSchema = z.object({
  paymentId: z.string().min(1, "ID de paiement requis"),
})

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  // Admin only
  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (dbUser?.role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  // Support both JSON and FormData
  let paymentId: string
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
    }
    const parsed = markPaidSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "ID de paiement requis" }, { status: 400 })
    }
    paymentId = parsed.data.paymentId
  } else {
    const formData = await request.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: "Donnees de formulaire invalides" }, { status: 400 })
    }
    paymentId = formData.get("paymentId") as string
    if (!paymentId) {
      return NextResponse.json({ error: "ID de paiement requis" }, { status: 400 })
    }
  }

  // Verify payment exists
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1)

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
  }

  if (payment.status === "PAID") {
    return NextResponse.json({ error: "Paiement deja marque comme paye" }, { status: 409 })
  }

  const now = new Date()

  await db
    .update(payments)
    .set({ status: "PAID", paidAt: now })
    .where(eq(payments.id, paymentId))

  // Audit log
  await db.insert(auditLog).values({
    adminId: session.user.id,
    action: "payment_marked_paid",
    targetId: paymentId,
    targetType: "payment",
    details: { amount: payment.amount, commissionAmount: payment.commissionAmount },
  })

  // If request was form submission, redirect back
  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL("/admin/payments", request.url))
  }

  return NextResponse.json({ success: true })
}
