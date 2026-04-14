"use client"

import { createAuthClient } from "better-auth/react"
import { adminClient, magicLinkClient } from "better-auth/client/plugins"

// No baseURL → Better Auth uses relative URLs, which works on any host
// (localhost, admin.panelcrapuleux.fr, etc.) without needing build-time env vars.
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), adminClient()],
})

export const { signIn, signOut, useSession } = authClient
