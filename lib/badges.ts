import { db } from "@/lib/db"
import { user, leads, payments, badges, userBadges } from "@/lib/db/schema"
import { eq, and, count, sum, gte } from "drizzle-orm"
import { createNotification } from "@/lib/notifications"
import { sendBadgeUnlockedEmail } from "@/lib/emails"

// ─── Badge condition evaluator ─────────────────────────────────────────

interface BadgeContext {
  userId: string
  totalLeads: number
  activeLeads: number
  convertedLeads: number
  totalCA: number
  totalCommissions: number
  recruitsCount: number
  grade: string
  paidPaymentsCount: number
  commentsCount: number
  daysSinceJoined: number
}

/**
 * Evaluate whether a badge condition is met given the user's context.
 */
export function evaluateBadgeCondition(slug: string, ctx: BadgeContext): boolean {
  switch (slug) {
    // PREMIERS_PAS
    case "first-lead":
      return ctx.totalLeads >= 1
    case "first-conversion":
      return ctx.convertedLeads >= 1
    case "first-commission":
      return ctx.totalCommissions > 0
    case "first-recruit":
      return ctx.recruitsCount >= 1
    case "profile-complete":
      // Evaluated separately — needs user fields check
      return false
    case "one-week-active":
      return ctx.daysSinceJoined >= 7
    case "one-month-active":
      return ctx.daysSinceJoined >= 30

    // PERFORMANCE
    case "10-leads":
      return ctx.totalLeads >= 10
    case "25-leads":
      return ctx.totalLeads >= 25
    case "50-leads":
      return ctx.totalLeads >= 50
    case "100-leads":
      return ctx.totalLeads >= 100
    case "5-conversions":
      return ctx.convertedLeads >= 5
    case "10-conversions":
      return ctx.convertedLeads >= 10
    case "ca-5000":
      return ctx.totalCA >= 5000
    case "ca-15000":
      return ctx.totalCA >= 15000
    case "ca-50000":
      return ctx.totalCA >= 50000
    case "ca-100000":
      return ctx.totalCA >= 100000

    // RESEAU
    case "3-recruits":
      return ctx.recruitsCount >= 3
    case "5-recruits":
      return ctx.recruitsCount >= 5
    case "10-recruits":
      return ctx.recruitsCount >= 10
    case "grade-silver":
      return ctx.grade === "SILVER" || ctx.grade === "GOLD" || ctx.grade === "PLATINUM" || ctx.grade === "DIAMOND"
    case "grade-gold":
      return ctx.grade === "GOLD" || ctx.grade === "PLATINUM" || ctx.grade === "DIAMOND"

    default:
      return false
  }
}

// ─── Award a badge ─────────────────────────────────────────────────────

export async function awardBadge(
  userId: string,
  badgeId: string,
  badgeSlug: string,
  badgeName: string,
  badgeDescription: string
): Promise<boolean> {
  // Check if user already has this badge
  const existing = await db
    .select({ id: userBadges.id })
    .from(userBadges)
    .where(
      and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId)
      )
    )
    .limit(1)

  if (existing.length > 0) return false

  // Award the badge
  await db.insert(userBadges).values({
    id: crypto.randomUUID(),
    userId,
    badgeId,
    isManual: false,
  })

  // Create notification
  await createNotification({
    userId,
    type: "badge_unlocked",
    title: `Badge debloque : ${badgeName}`,
    message: badgeDescription,
    link: "/badges",
  })

  // Send email
  const userRow = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (userRow.length > 0) {
    await sendBadgeUnlockedEmail({
      to: userRow[0].email,
      userName: userRow[0].name,
      badgeName,
      badgeDescription,
    })
  }

  return true
}

// ─── Check and award all eligible badges ───────────────────────────────

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  // Gather context
  const [
    userRow,
    totalLeadsResult,
    activeLeadsResult,
    convertedResult,
    caResult,
    commissionsResult,
    recruitsResult,
    paidPaymentsResult,
    commentsResult,
  ] = await Promise.all([
    db
      .select({
        grade: user.grade,
        createdAt: user.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        city: user.city,
        bio: user.bio,
        iban: user.iban,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),
    db.select({ count: count() }).from(leads).where(eq(leads.affiliateId, userId)),
    db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.affiliateId, userId), eq(leads.status, "ACTIVE"))),
    db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.affiliateId, userId), eq(leads.step, "E"))),
    db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(eq(payments.affiliateId, userId), eq(payments.status, "PAID"))),
    db
      .select({
        direct: sum(payments.commissionAmount),
        indirect: sum(payments.commissionIndirect),
      })
      .from(payments)
      .where(and(eq(payments.affiliateId, userId), eq(payments.status, "PAID"))),
    db
      .select({ count: count() })
      .from(user)
      .where(and(eq(user.parentId, userId), eq(user.role, "affiliate"))),
    db
      .select({ count: count() })
      .from(payments)
      .where(and(eq(payments.affiliateId, userId), eq(payments.status, "PAID"))),
    db.select({ count: count() }).from(leads).where(eq(leads.affiliateId, userId)),
  ])

  if (userRow.length === 0) return []

  const u = userRow[0]
  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const ctx: BadgeContext = {
    userId,
    totalLeads: totalLeadsResult[0]?.count ?? 0,
    activeLeads: activeLeadsResult[0]?.count ?? 0,
    convertedLeads: convertedResult[0]?.count ?? 0,
    totalCA: Number(caResult[0]?.total) || 0,
    totalCommissions:
      (Number(commissionsResult[0]?.direct) || 0) +
      (Number(commissionsResult[0]?.indirect) || 0),
    recruitsCount: recruitsResult[0]?.count ?? 0,
    grade: u.grade,
    paidPaymentsCount: paidPaymentsResult[0]?.count ?? 0,
    commentsCount: commentsResult[0]?.count ?? 0,
    daysSinceJoined,
  }

  // Special check for profile-complete
  const isProfileComplete =
    !!u.firstName && !!u.lastName && !!u.phone && !!u.city && !!u.bio && !!u.iban

  // Get all automatic badges
  const allBadges = await db
    .select()
    .from(badges)
    .where(eq(badges.isManual, false))

  // Get user's existing badges
  const existingBadges = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))

  const existingBadgeIds = new Set(existingBadges.map((b) => b.badgeId))

  const awarded: string[] = []

  for (const badge of allBadges) {
    if (existingBadgeIds.has(badge.id)) continue

    let eligible: boolean
    if (badge.slug === "profile-complete") {
      eligible = isProfileComplete
    } else {
      eligible = evaluateBadgeCondition(badge.slug, ctx)
    }

    if (eligible) {
      const wasAwarded = await awardBadge(
        userId,
        badge.id,
        badge.slug,
        badge.name,
        badge.description
      )
      if (wasAwarded) {
        awarded.push(badge.slug)
      }
    }
  }

  return awarded
}
