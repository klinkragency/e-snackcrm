// Standalone migration runner for the `migrate` docker-compose service.
// Uses drizzle-orm directly — no drizzle-kit / esbuild needed at runtime.

import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import pg from "pg"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: url })
  const db = drizzle(pool)

  console.log("Running migrations…")
  await migrate(db, { migrationsFolder: "./drizzle" })
  console.log("✅ Migrations applied")

  await pool.end()
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
