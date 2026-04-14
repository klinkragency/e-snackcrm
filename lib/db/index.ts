import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Lazy init: Next.js evaluates module-level code during build-time page
// collection (e.g. to render /_not-found), and we don't want to crash the
// build when DATABASE_URL is absent. Throw only when someone actually uses db.

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getDb() {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }
  _db = drizzle(new Pool({ connectionString: url }), { schema })
  return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    const target = getDb()
    const value = target[prop as keyof typeof target]
    return typeof value === "function" ? value.bind(target) : value
  },
})

export * from "./schema"
