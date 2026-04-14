import { randomUUID } from "crypto"
import { db, user } from "@/lib/db"

let seedPromise: Promise<void> | null = null

/**
 * Creates the initial dashboard admin from INITIAL_DASHBOARD_ADMIN_EMAIL
 * if no user exists yet. Idempotent and safe to call repeatedly —
 * we memoize the first run per process to avoid querying on every request.
 */
export async function ensureInitialAdminSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed()
  }
  return seedPromise
}

async function runSeed(): Promise<void> {
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
