import { spawn as spawnProcess } from "node:child_process"
import { writeFile, rm } from "node:fs/promises"
import path from "node:path"

const SITES_DIR = process.env.CADDY_SITES_DIR || "/etc/caddy/sites"
const CADDY_CONTAINER = process.env.CADDY_CONTAINER || "caddy-host"
const CADDY_CONFIG = "/etc/caddy/Caddyfile"

export const CLIENT_DOMAIN_SUFFIX = process.env.CLIENT_DOMAIN_SUFFIX || "panelcrapuleux.fr"

/** Full public URL for a given client slug (e.g. "https://chez-mario.panelcrapuleux.fr"). */
export function publicUrlForSlug(slug: string): string {
  return `https://${slug}.${CLIENT_DOMAIN_SUFFIX}`
}

/**
 * Writes the Caddy vhost for a client and reloads Caddy.
 * Caddy auto-provisions a TLS cert on first request via Let's Encrypt HTTP-01.
 * The backend target is 127.0.0.1:<hostPort> — Caddy runs network_mode: host
 * so it shares the host's loopback, no Docker network gymnastics required.
 */
export async function upsertClientSite(slug: string, hostPort: number): Promise<void> {
  const host = `${slug}.${CLIENT_DOMAIN_SUFFIX}`
  const site = `${host} {
\tencode gzip zstd
\theader {
\t\tStrict-Transport-Security "max-age=31536000"
\t\tX-Content-Type-Options "nosniff"
\t\tReferrer-Policy "strict-origin-when-cross-origin"
\t}
\treverse_proxy 127.0.0.1:${hostPort}
}
`
  await writeFile(path.join(SITES_DIR, `${slug}.caddy`), site)
  await reloadCaddy()
}

export async function removeClientSite(slug: string): Promise<void> {
  try {
    await rm(path.join(SITES_DIR, `${slug}.caddy`))
  } catch {
    // Not present, fine
  }
  await reloadCaddy()
}

/** Triggers a zero-downtime Caddy reload by shelling into its container. */
async function reloadCaddy(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let stderr = ""
    const child = spawnProcess(
      "docker",
      ["exec", CADDY_CONTAINER, "caddy", "reload", "--config", CADDY_CONFIG],
      { shell: false }
    )
    child.stderr?.on("data", (d) => { stderr += d.toString() })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`caddy reload exit ${code}: ${stderr.slice(-400)}`))
    })
  })
}
