import { pgTable, text, timestamp, boolean, uuid, pgEnum } from "drizzle-orm/pg-core"

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
