import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db, user } from "@/lib/db"

let seedPromise: Promise<void> | null = null

/**
 * Runs two safety nets at first render of the process (memoized):
 *
 * 1. If the user table is empty and INITIAL_DASHBOARD_ADMIN_EMAIL is set,
 *    insert that user with role=admin so the owner can log in on a fresh
 *    deployment.
 * 2. If SUPER_ADMIN_EMAIL is set and the matching user exists with a
 *    role other than 'admin', promote them. This guarantees the super
 *    admin is always reachable even if a previous deploy seeded them
 *    with the wrong role (pre-admin-plugin data).
 */
export async function ensureInitialAdminSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed()
  }
  return seedPromise
}

async function runSeed(): Promise<void> {
  await seedInitialAdminIfEmpty()
  await promoteSuperAdmin()
  // CRM badge catalog (24 badges, idempotent)
  try {
    const { seedBadges } = await import("@/lib/seed-crm")
    await seedBadges()
  } catch (err) {
    console.error("Failed to seed CRM badges:", err)
  }
}

async function seedInitialAdminIfEmpty(): Promise<void> {
  const email = process.env.INITIAL_DASHBOARD_ADMIN_EMAIL
  if (!email) return

  const name = process.env.INITIAL_DASHBOARD_ADMIN_NAME || "Admin"

  try {
    const existing = await db.select({ id: user.id }).from(user).limit(1)
    if (existing.length > 0) return

    await db.insert(user).values({
      id: randomUUID(),
      email,
      name,
      emailVerified: true,
      role: "admin",
    })
    console.log(`✅ Initial dashboard admin seeded: ${email} (role=admin)`)
  } catch (err) {
    console.error("Failed to seed initial admin:", err)
  }
}

async function promoteSuperAdmin(): Promise<void> {
  const superEmail = process.env.SUPER_ADMIN_EMAIL
  if (!superEmail) return

  try {
    const [existing] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, superEmail))
      .limit(1)

    if (!existing || existing.role === "admin") return

    await db.update(user).set({ role: "admin" }).where(eq(user.id, existing.id))
    console.log(`✅ Super admin promoted to role=admin: ${superEmail}`)
  } catch (err) {
    console.error("Failed to promote super admin:", err)
  }
}
