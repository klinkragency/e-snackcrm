// ─── Role (Better Auth admin plugin — lowercase text strings) ──────────
export type Role = "user" | "admin" | "affiliate"
export const ROLES = ["user", "admin", "affiliate"] as const

// ─── Grade ─────────────────────────────────────────────────────────────
export const GRADES = ["STARTER", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const
export type Grade = (typeof GRADES)[number]

export interface GradeConfig {
  grade: Grade
  label: string
  minCA: number
  minFilleuls: number
  commissionDirect: number
  commissionN1: number
  commissionN2: number
  color: string
}

export const GRADE_CONFIG: Record<Grade, GradeConfig> = {
  STARTER: {
    grade: "STARTER",
    label: "Starter",
    minCA: 0,
    minFilleuls: 0,
    commissionDirect: 0.05,
    commissionN1: 0,
    commissionN2: 0,
    color: "#6B7280",
  },
  SILVER: {
    grade: "SILVER",
    label: "Silver",
    minCA: 5000,
    minFilleuls: 2,
    commissionDirect: 0.08,
    commissionN1: 0.02,
    commissionN2: 0,
    color: "#9CA3AF",
  },
  GOLD: {
    grade: "GOLD",
    label: "Gold",
    minCA: 15000,
    minFilleuls: 5,
    commissionDirect: 0.10,
    commissionN1: 0.03,
    commissionN2: 0.01,
    color: "#F59E0B",
  },
  PLATINUM: {
    grade: "PLATINUM",
    label: "Platinum",
    minCA: 40000,
    minFilleuls: 10,
    commissionDirect: 0.12,
    commissionN1: 0.04,
    commissionN2: 0.02,
    color: "#8B5CF6",
  },
  DIAMOND: {
    grade: "DIAMOND",
    label: "Diamond",
    minCA: 100000,
    minFilleuls: 20,
    commissionDirect: 0.15,
    commissionN1: 0.05,
    commissionN2: 0.03,
    color: "#3B82F6",
  },
}

// ─── Pipeline Steps ────────────────────────────────────────────────────
export const STEPS = ["A", "B", "C", "D", "E"] as const
export type Step = (typeof STEPS)[number]

export interface StepConfig {
  step: Step
  label: string
  description: string
  color: string
}

export const STEP_CONFIG: Record<Step, StepConfig> = {
  A: {
    step: "A",
    label: "Prospection",
    description: "Lead identifie, premier contact en cours",
    color: "#6366F1",
  },
  B: {
    step: "B",
    label: "Qualification",
    description: "Besoin qualifie, scoring effectue",
    color: "#8B5CF6",
  },
  C: {
    step: "C",
    label: "Proposition",
    description: "Devis envoye, en attente de retour",
    color: "#F59E0B",
  },
  D: {
    step: "D",
    label: "Negociation",
    description: "Maquette presentee, negociation en cours",
    color: "#F97316",
  },
  E: {
    step: "E",
    label: "Cloture",
    description: "Contrat signe, paiement en cours",
    color: "#10B981",
  },
}

// ─── Lead Status / Scoring ─────────────────────────────────────────────
export const LEAD_STATUSES = ["ACTIVE", "ARCHIVED", "LOST"] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const SCORINGS = ["HOT", "WARM", "COLD"] as const
export type Scoring = (typeof SCORINGS)[number]

// ─── Payment ───────────────────────────────────────────────────────────
export const PAYMENT_TYPES = ["ACOMPTE", "INTERMEDIAIRE", "SOLDE"] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

export const PAYMENT_STATUSES = ["PENDING", "PAID"] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

// ─── Badge ─────────────────────────────────────────────────────────────
export const BADGE_CATEGORIES = ["PREMIERS_PAS", "PERFORMANCE", "RESEAU", "MANUEL"] as const
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number]

export const BADGE_RARITIES = ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const
export type BadgeRarity = (typeof BADGE_RARITIES)[number]

// ─── Solution Catalog ──────────────────────────────────────────────────
export interface SolutionItem {
  id: string
  name: string
  description: string
  priceRange: string
  category: string
}

export const SOLUTION_CATALOG: SolutionItem[] = [
  {
    id: "site-vitrine",
    name: "Site Vitrine",
    description: "Site web professionnel pour presenter votre activite",
    priceRange: "1 500 - 4 000 EUR",
    category: "web",
  },
  {
    id: "e-commerce",
    name: "E-commerce",
    description: "Boutique en ligne avec paiement integre",
    priceRange: "3 000 - 10 000 EUR",
    category: "web",
  },
  {
    id: "app-mobile",
    name: "Application Mobile",
    description: "Application iOS et Android sur mesure",
    priceRange: "5 000 - 20 000 EUR",
    category: "mobile",
  },
  {
    id: "saas",
    name: "SaaS / Plateforme",
    description: "Solution logicielle cloud complete",
    priceRange: "10 000 - 50 000 EUR",
    category: "software",
  },
  {
    id: "branding",
    name: "Branding & Identite",
    description: "Logo, charte graphique et identite visuelle",
    priceRange: "800 - 3 000 EUR",
    category: "design",
  },
  {
    id: "seo",
    name: "SEO & Marketing Digital",
    description: "Referencement naturel et strategie digitale",
    priceRange: "500 - 3 000 EUR/mois",
    category: "marketing",
  },
  {
    id: "maintenance",
    name: "Maintenance & Support",
    description: "Support technique et maintenance applicative",
    priceRange: "200 - 1 500 EUR/mois",
    category: "support",
  },
  {
    id: "formation",
    name: "Formation",
    description: "Formation aux outils digitaux",
    priceRange: "500 - 2 000 EUR",
    category: "training",
  },
]

// ─── Notification Types ────────────────────────────────────────────────
export const NOTIFICATION_TYPES = [
  "new_lead",
  "lead_step_changed",
  "payment_confirmed",
  "badge_unlocked",
  "new_recruit",
  "grade_upgrade",
  "comment_added",
  "system",
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

// ─── Composite Types ───────────────────────────────────────────────────

export interface AffiliateProfile {
  id: string
  name: string
  email: string
  role: Role
  firstName: string | null
  lastName: string | null
  phone: string | null
  city: string | null
  bio: string | null
  avatarUrl: string | null
  iban: string | null
  grade: Grade
  parrainageCode: string | null
  isActive: boolean
  commissionRate: number
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AffiliateStats {
  totalLeads: number
  activeLeads: number
  convertedLeads: number
  totalCA: number
  totalCommissions: number
  pendingCommissions: number
  recruitsCount: number
  currentGrade: Grade
  nextGrade: Grade | null
  progressToNextGrade: number
}

export interface LeadWithRelations {
  id: string
  affiliateId: string
  step: Step
  status: LeadStatus
  clientFirstname: string
  clientLastname: string
  clientEmail: string
  clientPhone: string
  clientCity: string | null
  clientPostal: string | null
  clientCountry: string
  clientCompany: string | null
  clientSector: string | null
  solution: string | null
  budgetEstimated: number | null
  scoring: Scoring | null
  finalAmount: number | null
  createdAt: Date
  updatedAt: Date
  affiliate?: AffiliateProfile
  paymentsCount?: number
  commentsCount?: number
}

export interface PipelineColumn {
  step: Step
  config: StepConfig
  leads: LeadWithRelations[]
  totalAmount: number
}

export interface CommissionBreakdown {
  direct: number
  indirectN1: number
  indirectN2: number
  total: number
}

export interface DashboardStats {
  affiliateCount: number
  totalLeads: number
  totalCA: number
  totalCommissions: number
  leadsByStep: Record<Step, number>
  topAffiliates: Array<{
    id: string
    name: string
    grade: Grade
    totalCA: number
    leadsCount: number
  }>
}

export interface PipelineFilters {
  search: string
  step: Step | "ALL"
  status: LeadStatus | "ALL"
  scoring: Scoring | "ALL"
  affiliateId: string | "ALL"
  dateFrom: string | null
  dateTo: string | null
}

export interface BadgeDefinition {
  slug: string
  name: string
  description: string
  category: BadgeCategory
  rarity: BadgeRarity
  iconSvg: string
  conditionText: string
  isManual: boolean
}
