import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { user, account } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const registerSchema = z.object({
  firstName: z.string().min(1, "Prenom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(6, "Telephone requis"),
  city: z.string().optional().default(""),
  password: z.string().min(8, "Minimum 8 caracteres"),
  sponsorCode: z.string().min(1, "Code parrain requis"),
})

function generateParrainageCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Donnees invalides"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const data = parsed.data

  // Find sponsor
  const [sponsor] = await db
    .select({ id: user.id, isActive: user.isActive })
    .from(user)
    .where(eq(user.parrainageCode, data.sponsorCode))
    .limit(1)

  if (!sponsor || !sponsor.isActive) {
    return NextResponse.json({ error: "Code parrain invalide ou inactif" }, { status: 400 })
  }

  // Check email uniqueness
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, data.email.toLowerCase()))
    .limit(1)

  if (existing) {
    return NextResponse.json({ error: "Cet email est deja utilise" }, { status: 409 })
  }

  const userId = crypto.randomUUID()
  const parrainageCode = generateParrainageCode()

  // Hash password using Web Crypto API
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data.password))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  const now = new Date()

  await db.insert(user).values({
    id: userId,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email.toLowerCase(),
    emailVerified: false,
    role: "affiliate",
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    city: data.city || null,
    grade: "STARTER",
    parrainageCode,
    isActive: true,
    commissionRate: 0.05,
    parentId: sponsor.id,
    createdAt: now,
    updatedAt: now,
  })

  // Create credential account for Better Auth
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ success: true, parrainageCode }, { status: 201 })
}
