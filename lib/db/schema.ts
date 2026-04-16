import { pgTable, text, timestamp, boolean, uuid, pgEnum, real, integer, json, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─── CRM Enums ─────────────────────────────────────────────────────────

export const gradeEnum = pgEnum("grade", ["STARTER", "SILVER", "GOLD", "PLATINUM", "DIAMOND"])
export const stepEnum = pgEnum("step", ["A", "B", "C", "D", "E"])
export const leadStatusEnum = pgEnum("lead_status", ["ACTIVE", "ARCHIVED", "LOST"])
export const scoringEnum = pgEnum("scoring", ["HOT", "WARM", "COLD"])
export const paymentTypeEnum = pgEnum("payment_type", ["ACOMPTE", "INTERMEDIAIRE", "SOLDE"])
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID"])
export const badgeCategoryEnum = pgEnum("badge_category", ["PREMIERS_PAS", "PERFORMANCE", "RESEAU", "MANUEL"])
export const badgeRarityEnum = pgEnum("badge_rarity", ["COMMON", "RARE", "EPIC", "LEGENDARY"])

// ─── Better Auth core tables ────────────────────────────────────────────
// Structure follows Better Auth 1.3+ defaults. Generated equivalent of
// `npx @better-auth/cli generate` written manually for transparency.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Admin plugin fields
  role: text("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  // ── CRM Affiliate fields ──
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  city: text("city"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  iban: text("iban"),
  grade: gradeEnum("grade").notNull().default("STARTER"),
  parrainageCode: text("parrainage_code").unique(),
  isActive: boolean("is_active").notNull().default(true),
  commissionRate: real("commission_rate").notNull().default(0.05),
  parentId: text("parent_id").references((): any => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  // Admin plugin: populated when an admin impersonates this user's session
  impersonatedBy: text("impersonated_by"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ─── App tables ─────────────────────────────────────────────────────────

export const clientStatus = pgEnum("client_status", [
  "draft",
  "provisioned",
  "deployed",
  "paused",
])

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  status: clientStatus("status").notNull().default("draft"),
  domain: text("domain").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerPhone: text("owner_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deployedAt: timestamp("deployed_at"),
  // Live instance fields (populated when a demo instance is running)
  publicUrl: text("public_url"),
  composeProject: text("compose_project"),
  ngrokContainerId: text("ngrok_container_id"),
})

export const clientConfig = pgTable("client_config", {
  clientId: uuid("client_id")
    .primaryKey()
    .references(() => clients.id, { onDelete: "cascade" }),

  // Seed values for the e-Snack instance's INITIAL_* env vars
  initialAdminEmail: text("initial_admin_email").notNull(),
  initialAdminPassword: text("initial_admin_password").notNull(),
  initialAdminName: text("initial_admin_name").notNull(),
  initialRestaurantName: text("initial_restaurant_name").notNull(),
  initialRestaurantSlug: text("initial_restaurant_slug").notNull(),

  // Third-party keys (nullable — features degrade without them)
  mollieApiKey: text("mollie_api_key"),
  resendApiKey: text("resend_api_key"),
  emailFromAddress: text("email_from_address").notNull(),

  // Auto-generated at client creation (32 bytes hex each)
  jwtSecret: text("jwt_secret").notNull(),
  cookieSecret: text("cookie_secret").notNull(),
  postgresPassword: text("postgres_password").notNull(),
  minioRootPassword: text("minio_root_password").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const managedContainers = pgTable("managed_containers", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Name used for the Docker container itself (unique among managed ones)
  dockerName: text("docker_name").notNull().unique(),
  image: text("image").notNull(),
  // Optional link to a client row (for e-Snack instances later)
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  // Who created it via the dashboard
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type ClientConfig = typeof clientConfig.$inferSelect
export type NewClientConfig = typeof clientConfig.$inferInsert
export type ManagedContainer = typeof managedContainers.$inferSelect
export type NewManagedContainer = typeof managedContainers.$inferInsert

// ─── CRM Affiliate tables ──────────────────────────────────────────────

export const leads = pgTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  affiliateId: text("affiliate_id").notNull().references(() => user.id),
  step: stepEnum("step").notNull().default("A"),
  status: leadStatusEnum("status").notNull().default("ACTIVE"),
  clientFirstname: text("client_firstname").notNull(),
  clientLastname: text("client_lastname").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientCity: text("client_city"),
  clientPostal: text("client_postal"),
  clientCountry: text("client_country").notNull().default("FR"),
  clientCompany: text("client_company"),
  clientSector: text("client_sector"),
  clientWebsite: text("client_website"),
  clientLinkedin: text("client_linkedin"),
  source: text("source"),
  initialNote: text("initial_note"),
  solution: text("solution"),
  budgetEstimated: real("budget_estimated"),
  scoring: scoringEnum("scoring"),
  mainNeed: text("main_need"),
  delayWanted: text("delay_wanted"),
  decisionMaker: boolean("decision_maker"),
  decisionMakerName: text("decision_maker_name"),
  competitiveContext: text("competitive_context"),
  objections: text("objections"),
  quoteStatus: text("quote_status"),
  quoteSentAt: timestamp("quote_sent_at"),
  quoteUrl: text("quote_url"),
  quoteAmount: real("quote_amount"),
  quoteValidity: timestamp("quote_validity"),
  quoteFeedback: text("quote_feedback"),
  quoteFollowup: timestamp("quote_followup"),
  quoteDiscount: real("quote_discount"),
  mockupUrl: text("mockup_url"),
  mockupPresentedAt: timestamp("mockup_presented_at"),
  mockupRevisions: integer("mockup_revisions").notNull().default(0),
  mockupValidated: text("mockup_validated"),
  mockupFeedback: text("mockup_feedback"),
  mockupRevisionHistory: json("mockup_revision_history"),
  finalAmount: real("final_amount"),
  signedAt: timestamp("signed_at"),
  contractNumber: text("contract_number"),
  contractUrl: text("contract_url"),
  stepAAt: timestamp("step_a_at"),
  stepBAt: timestamp("step_b_at"),
  stepCAt: timestamp("step_c_at"),
  stepDAt: timestamp("step_d_at"),
  stepEAt: timestamp("step_e_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text("lead_id").notNull().references(() => leads.id),
  affiliateId: text("affiliate_id").notNull().references(() => user.id),
  type: paymentTypeEnum("type").notNull(),
  amount: real("amount").notNull(),
  commissionAmount: real("commission_amount").notNull().default(0),
  commissionIndirect: real("commission_indirect").notNull().default(0),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const badges = pgTable("badges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: badgeCategoryEnum("category").notNull(),
  rarity: badgeRarityEnum("rarity").notNull(),
  iconSvg: text("icon_svg").notNull(),
  conditionText: text("condition_text").notNull(),
  isManual: boolean("is_manual").notNull().default(false),
})

export const userBadges = pgTable("user_badges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  badgeId: text("badge_id").notNull().references(() => badges.id),
  obtainedAt: timestamp("obtained_at").notNull().defaultNow(),
  isManual: boolean("is_manual").notNull().default(false),
  adminNote: text("admin_note"),
}, (table) => [
  unique("user_badge_unique").on(table.userId, table.badgeId),
])

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text("lead_id").notNull().references(() => leads.id),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text("lead_id").notNull().references(() => leads.id),
  authorId: text("author_id").notNull().references(() => user.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const timelineEvents = pgTable("timeline_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text("lead_id").notNull().references(() => leads.id),
  type: text("type").notNull(),
  description: text("description").notNull(),
  actorId: text("actor_id"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  adminId: text("admin_id").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id"),
  targetType: text("target_type"),
  details: json("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ─── Relations ──────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ one, many }) => ({
  parent: one(user, { fields: [user.parentId], references: [user.id], relationName: "recruitment" }),
  recruits: many(user, { relationName: "recruitment" }),
  leads: many(leads),
  payments: many(payments),
  userBadges: many(userBadges),
  comments: many(comments),
  notifications: many(notifications),
}))

export const leadsRelations = relations(leads, ({ one, many }) => ({
  affiliate: one(user, { fields: [leads.affiliateId], references: [user.id] }),
  payments: many(payments),
  documents: many(documents),
  comments: many(comments),
  timelineEvents: many(timelineEvents),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  lead: one(leads, { fields: [payments.leadId], references: [leads.id] }),
  affiliate: one(user, { fields: [payments.affiliateId], references: [user.id] }),
}))

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}))

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(user, { fields: [userBadges.userId], references: [user.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  lead: one(leads, { fields: [documents.leadId], references: [leads.id] }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  lead: one(leads, { fields: [comments.leadId], references: [leads.id] }),
  author: one(user, { fields: [comments.authorId], references: [user.id] }),
}))

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  lead: one(leads, { fields: [timelineEvents.leadId], references: [leads.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, { fields: [notifications.userId], references: [user.id] }),
}))

// ─── CRM Type exports ──────────────────────────────────────────────────

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type Badge = typeof badges.$inferSelect
export type UserBadge = typeof userBadges.$inferSelect
export type Document = typeof documents.$inferSelect
export type Comment = typeof comments.$inferSelect
export type TimelineEvent = typeof timelineEvents.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type AuditLog = typeof auditLog.$inferSelect
