import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, magicLink } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { Resend } from "resend"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const emailFrom = process.env.EMAIL_FROM_ADDRESS || "no-reply@klinkragency.fr"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // Locked-down access: only pre-seeded users can log in.
  // Email/password enabled for affiliate registration via /join/[code].
  emailAndPassword: { enabled: true },

  plugins: [
    magicLink({
      disableSignUp: true,
      expiresIn: 60 * 15, // 15 minutes
      sendMagicLink: async ({ email, url }) => {
        const logFallback = () => {
          console.log("\n┌─ MAGIC LINK (dev) ─────────────────────────────────")
          console.log(`│ Email: ${email}`)
          console.log(`│ Link:  ${url}`)
          console.log("└─────────────────────────────────────────────────────\n")
        }

        if (!resend) {
          logFallback()
          return
        }

        try {
          const { error } = await resend.emails.send({
            from: emailFrom,
            to: email,
            subject: "Connexion Klinkragency Dashboard",
            html: `
              <p>Bonjour,</p>
              <p>Voici votre lien de connexion au dashboard Klinkragency (valable 15 minutes) :</p>
              <p><a href="${url}">Se connecter</a></p>
              <p>Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
            `,
          })
          if (error) {
            console.warn("[magic-link] Resend error — falling back to console:", error.message)
            logFallback()
          }
        } catch (err) {
          console.warn("[magic-link] Resend threw — falling back to console:", err)
          logFallback()
        }
      },
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      bannedUserMessage: "Votre compte a été désactivé. Contactez un administrateur.",
    }),
    nextCookies(),
  ],
})

/**
 * Super admin identity is hardcoded via env var (single account with
 * bypass powers — ban/unban/disconnect other admins, change roles).
 * Anyone else with role='admin' has normal admin privileges but cannot
 * act against admin peers.
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const superEmail = process.env.SUPER_ADMIN_EMAIL
  if (!superEmail) return false
  return email.toLowerCase() === superEmail.toLowerCase()
}
