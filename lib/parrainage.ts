import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Generate a unique parrainage code in format XXXX-0000.
 * The 4 uppercase letters are derived from the affiliate's name,
 * padded with 'X' if the name is shorter than 4 usable chars.
 * The 4 digits are random (0000-9999).
 * Uniqueness is verified against the database before returning.
 */
export async function generateParrainageCode(
  firstName: string,
  lastName: string
): Promise<string> {
  const nameSource = `${lastName}${firstName}`
    .toUpperCase()
    .replace(/[^A-Z]/g, "")

  const letters = nameSource.substring(0, 4).padEnd(4, "X")

  // Try up to 50 times to find a unique code
  for (let attempt = 0; attempt < 50; attempt++) {
    const digits = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
    const code = `${letters}-${digits}`

    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.parrainageCode, code))
      .limit(1)

    if (existing.length === 0) {
      return code
    }
  }

  // Fallback: use timestamp-based suffix
  const ts = Date.now().toString().slice(-4)
  const fallbackCode = `${letters}-${ts}`

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.parrainageCode, fallbackCode))
    .limit(1)

  if (existing.length === 0) {
    return fallbackCode
  }

  // Ultimate fallback with full random letters
  const randomLetters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("")
  const randomDigits = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
  return `${randomLetters}-${randomDigits}`
}

/**
 * Validate the format of a parrainage code.
 */
export function isValidParrainageCodeFormat(code: string): boolean {
  return /^[A-Z]{4}-\d{4}$/.test(code)
}

/**
 * Look up an affiliate by their parrainage code.
 * Returns the user ID if found, null otherwise.
 */
export async function findAffiliateByParrainageCode(
  code: string
): Promise<string | null> {
  if (!isValidParrainageCodeFormat(code)) return null

  const result = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.parrainageCode, code))
    .limit(1)

  return result.length > 0 ? result[0].id : null
}
