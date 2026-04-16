import { db } from "@/lib/db"
import { user, leads, payments } from "@/lib/db/schema"
import { eq, and, count, sum, gte, sql } from "drizzle-orm"
import { GRADE_CONFIG, GRADES, type Grade, type CommissionBreakdown, type AffiliateStats } from "@/types"

// ─── Grade Config Helpers ──────────────────────────────────────────────

export function getGradeConfig(grade: Grade) {
  return GRADE_CONFIG[grade]
}

export function getNextGrade(grade: Grade): Grade | null {
  const idx = GRADES.indexOf(grade)
  if (idx === -1 || idx >= GRADES.length - 1) return null
  return GRADES[idx + 1]
}

// ─── Commission Calculation ────────────────────────────────────────────

/**
 * Calculate commission breakdown for a payment amount given an affiliate's grade.
 * Direct commission goes to the affiliate who closed the deal.
 * N1 goes to the affiliate's parent (parrain).
 * N2 goes to the grandparent.
 */
export function calculateCommission(
  amount: number,
  affiliateGrade: Grade
): CommissionBreakdown {
  const config = GRADE_CONFIG[affiliateGrade]
  const direct = Math.round(amount * config.commissionDirect * 100) / 100
  const indirectN1 = Math.round(amount * config.commissionN1 * 100) / 100
  const indirectN2 = Math.round(amount * config.commissionN2 * 100) / 100
  return {
    direct,
    indirectN1,
    indirectN2,
    total: Math.round((direct + indirectN1 + indirectN2) * 100) / 100,
  }
}

/**
 * Calculate full commission chain for a payment.
 * Returns who gets what: the direct affiliate, their N1 parent, and N2 grandparent.
 */
export async function calculateCommissionChain(
  affiliateId: string,
  amount: number
): Promise<{
  direct: { userId: string; amount: number }
  n1: { userId: string; amount: number } | null
  n2: { userId: string; amount: number } | null
}> {
  const affiliate = await db
    .select({ id: user.id, grade: user.grade, parentId: user.parentId })
    .from(user)
    .where(eq(user.id, affiliateId))
    .limit(1)

  if (affiliate.length === 0) {
    throw new Error(`Affiliate ${affiliateId} not found`)
  }

  const aff = affiliate[0]
  const config = GRADE_CONFIG[aff.grade]
  const directAmount = Math.round(amount * config.commissionDirect * 100) / 100

  const result: {
    direct: { userId: string; amount: number }
    n1: { userId: string; amount: number } | null
    n2: { userId: string; amount: number } | null
  } = {
    direct: { userId: aff.id, amount: directAmount },
    n1: null,
    n2: null,
  }

  // N1: parent gets indirect commission based on THEIR grade
  if (aff.parentId) {
    const parent = await db
      .select({ id: user.id, grade: user.grade, parentId: user.parentId })
      .from(user)
      .where(eq(user.id, aff.parentId))
      .limit(1)

    if (parent.length > 0) {
      const parentConfig = GRADE_CONFIG[parent[0].grade]
      const n1Amount = Math.round(amount * parentConfig.commissionN1 * 100) / 100
      if (n1Amount > 0) {
        result.n1 = { userId: parent[0].id, amount: n1Amount }
      }

      // N2: grandparent gets indirect N2 commission based on THEIR grade
      if (parent[0].parentId) {
        const grandparent = await db
          .select({ id: user.id, grade: user.grade })
          .from(user)
          .where(eq(user.id, parent[0].parentId))
          .limit(1)

        if (grandparent.length > 0) {
          const gpConfig = GRADE_CONFIG[grandparent[0].grade]
          const n2Amount = Math.round(amount * gpConfig.commissionN2 * 100) / 100
          if (n2Amount > 0) {
            result.n2 = { userId: grandparent[0].id, amount: n2Amount }
          }
        }
      }
    }
  }

  return result
}

// ─── Grade Eligibility ─────────────────────────────────────────────────

/**
 * Check if an affiliate is eligible for a grade upgrade.
 * Returns the highest grade they qualify for.
 */
export async function checkGradeEligibility(affiliateId: string): Promise<{
  currentGrade: Grade
  eligibleGrade: Grade
  shouldUpgrade: boolean
  totalCA: number
  recruitsCount: number
}> {
  // Get current affiliate info
  const affiliateRow = await db
    .select({ grade: user.grade })
    .from(user)
    .where(eq(user.id, affiliateId))
    .limit(1)

  if (affiliateRow.length === 0) {
    throw new Error(`Affiliate ${affiliateId} not found`)
  }

  const currentGrade = affiliateRow[0].grade

  // Total CA from paid payments
  const caResult = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(
        eq(payments.affiliateId, affiliateId),
        eq(payments.status, "PAID")
      )
    )

  const totalCA = Number(caResult[0]?.total) || 0

  // Count direct recruits
  const recruitsResult = await db
    .select({ count: count() })
    .from(user)
    .where(
      and(
        eq(user.parentId, affiliateId),
        eq(user.role, "affiliate")
      )
    )

  const recruitsCount = recruitsResult[0]?.count || 0

  // Find highest eligible grade
  let eligibleGrade: Grade = "STARTER"
  for (const g of GRADES) {
    const config = GRADE_CONFIG[g]
    if (totalCA >= config.minCA && recruitsCount >= config.minFilleuls) {
      eligibleGrade = g
    }
  }

  const shouldUpgrade = GRADES.indexOf(eligibleGrade) > GRADES.indexOf(currentGrade)

  return {
    currentGrade,
    eligibleGrade,
    shouldUpgrade,
    totalCA,
    recruitsCount,
  }
}

// ─── Affiliate Stats ───────────────────────────────────────────────────

export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  // Total leads
  const totalLeadsResult = await db
    .select({ count: count() })
    .from(leads)
    .where(eq(leads.affiliateId, affiliateId))

  const totalLeads = totalLeadsResult[0]?.count || 0

  // Active leads
  const activeLeadsResult = await db
    .select({ count: count() })
    .from(leads)
    .where(
      and(
        eq(leads.affiliateId, affiliateId),
        eq(leads.status, "ACTIVE")
      )
    )

  const activeLeads = activeLeadsResult[0]?.count || 0

  // Converted leads (step E)
  const convertedResult = await db
    .select({ count: count() })
    .from(leads)
    .where(
      and(
        eq(leads.affiliateId, affiliateId),
        eq(leads.step, "E")
      )
    )

  const convertedLeads = convertedResult[0]?.count || 0

  // Total CA (paid payments)
  const caResult = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(
        eq(payments.affiliateId, affiliateId),
        eq(payments.status, "PAID")
      )
    )

  const totalCA = Number(caResult[0]?.total) || 0

  // Total commissions earned (paid)
  const commissionsResult = await db
    .select({
      direct: sum(payments.commissionAmount),
      indirect: sum(payments.commissionIndirect),
    })
    .from(payments)
    .where(
      and(
        eq(payments.affiliateId, affiliateId),
        eq(payments.status, "PAID")
      )
    )

  const totalCommissions =
    (Number(commissionsResult[0]?.direct) || 0) +
    (Number(commissionsResult[0]?.indirect) || 0)

  // Pending commissions
  const pendingResult = await db
    .select({
      direct: sum(payments.commissionAmount),
      indirect: sum(payments.commissionIndirect),
    })
    .from(payments)
    .where(
      and(
        eq(payments.affiliateId, affiliateId),
        eq(payments.status, "PENDING")
      )
    )

  const pendingCommissions =
    (Number(pendingResult[0]?.direct) || 0) +
    (Number(pendingResult[0]?.indirect) || 0)

  // Recruits count
  const recruitsResult = await db
    .select({ count: count() })
    .from(user)
    .where(
      and(
        eq(user.parentId, affiliateId),
        eq(user.role, "affiliate")
      )
    )

  const recruitsCount = recruitsResult[0]?.count || 0

  // Current grade
  const affiliateRow = await db
    .select({ grade: user.grade })
    .from(user)
    .where(eq(user.id, affiliateId))
    .limit(1)

  const currentGrade = affiliateRow[0]?.grade ?? "STARTER"
  const nextGrade = getNextGrade(currentGrade)

  // Progress to next grade (percentage)
  let progressToNextGrade = 100
  if (nextGrade) {
    const nextConfig = GRADE_CONFIG[nextGrade]
    const caProgress = nextConfig.minCA > 0 ? Math.min(totalCA / nextConfig.minCA, 1) : 1
    const recruitsProgress =
      nextConfig.minFilleuls > 0 ? Math.min(recruitsCount / nextConfig.minFilleuls, 1) : 1
    progressToNextGrade = Math.round(((caProgress + recruitsProgress) / 2) * 100)
  }

  return {
    totalLeads,
    activeLeads,
    convertedLeads,
    totalCA,
    totalCommissions,
    pendingCommissions,
    recruitsCount,
    currentGrade,
    nextGrade,
    progressToNextGrade,
  }
}
