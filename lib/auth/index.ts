import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
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
  // New sign-ups through magic link are rejected.
  emailAndPassword: { enabled: false },

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
    nextCookies(),
  ],
})
