import Docker from "dockerode"
export type { ContainerInfo as DockerContainerInfo } from "dockerode"

/** Label applied to every container created via the dashboard.
 *  We filter by this label in list/get operations to hide system containers. */
export const MANAGED_LABEL = "klinkragency.managed"

let client: Docker | null = null

export function getDocker(): Docker {
  if (!client) {
    client = new Docker({ socketPath: "/var/run/docker.sock" })
  }
  return client
}

export type ContainerSummary = {
  id: string
  name: string
  image: string
  state: string // "running" | "exited" | "restarting" | "paused" | "created" | ...
  status: string // Human-readable ("Up 3 hours", "Exited (0) 5 minutes ago")
  createdAt: number
  ports: { privatePort: number; publicPort?: number; type: string }[]
  clientId: string | null
  clientSlug: string | null
}

/** Lists every container the dashboard cares about:
 *  A) manually created via the "new container" dialog (MANAGED_LABEL)
 *  B) part of a client instance stack, matched by compose project label
 *     (com.docker.compose.project=esnack-*)
 *
 * DB rows provide clientId/slug linkage for the badge; Docker is the
 * source of truth for live state. Containers not in the DB yet (orphans
 * of a failed deploy) still show up so they can be inspected and killed.
 */
export async function listManagedContainers(
  dbRows: { dockerName: string; clientId: string | null; clientSlug: string | null }[]
): Promise<ContainerSummary[]> {
  const docker = getDocker()

  const all = await docker.listContainers({ all: true })

  const dbNameToRow = new Map(dbRows.map((r) => [r.dockerName, r]))

  return all
    .filter((c) => {
      if (c.Labels?.[MANAGED_LABEL] === "true") return true
      const project = c.Labels?.["com.docker.compose.project"]
      if (project?.startsWith("esnack-")) return true
      // Also include anything a DB row names explicitly (belt-and-suspenders)
      const name = c.Names[0]?.replace(/^\//, "")
      return name ? dbNameToRow.has(name) : false
    })
    .map((c) => {
      const name = c.Names[0]?.replace(/^\//, "") ?? "unknown"
      const dbRow = dbNameToRow.get(name)
      const project = c.Labels?.["com.docker.compose.project"]
      // Derive slug from compose project name: esnack-<slug>
      const composeSlug = project?.startsWith("esnack-") ? project.slice("esnack-".length) : null
      return {
        id: c.Id,
        name,
        image: c.Image,
        state: c.State,
        status: c.Status,
        createdAt: c.Created * 1000,
        ports: c.Ports.map((p) => ({
          privatePort: p.PrivatePort,
          publicPort: p.PublicPort,
          type: p.Type,
        })),
        clientId: dbRow?.clientId ?? c.Labels?.["klinkragency.client_id"] ?? null,
        clientSlug:
          dbRow?.clientSlug ?? c.Labels?.["klinkragency.client_slug"] ?? composeSlug,
      }
    })
}

export async function getContainerInfo(id: string) {
  const docker = getDocker()
  const container = docker.getContainer(id)
  const info = await container.inspect()
  // Only return if it's managed — otherwise 404 equivalent
  if (info.Config.Labels?.[MANAGED_LABEL] !== "true") {
    throw new Error("Not found")
  }
  return info
}

export async function startContainer(id: string): Promise<void> {
  await getContainerInfo(id) // ensures managed
  await getDocker().getContainer(id).start()
}

export async function stopContainer(id: string): Promise<void> {
  await getContainerInfo(id)
  await getDocker().getContainer(id).stop({ t: 10 })
}

export async function restartContainer(id: string): Promise<void> {
  await getContainerInfo(id)
  await getDocker().getContainer(id).restart({ t: 10 })
}

export async function removeContainer(id: string): Promise<void> {
  await getContainerInfo(id)
  // force=true so running containers are killed first
  await getDocker().getContainer(id).remove({ force: true })
}

export async function getContainerLogs(id: string, tailLines = 100): Promise<string> {
  await getContainerInfo(id)
  const container = getDocker().getContainer(id)
  const stream = await container.logs({
    stdout: true,
    stderr: true,
    tail: tailLines,
    follow: false,
    timestamps: false,
  })
  // Docker logs over the API come with an 8-byte header per stream frame
  // (stream type + size). We strip those headers to get clean text.
  return stripDockerLogHeaders(stream as unknown as Buffer)
}

function stripDockerLogHeaders(buf: Buffer): string {
  let out = ""
  let i = 0
  while (i < buf.length) {
    // header: [stream(1)][0][0][0][size(4-BE)]
    if (i + 8 > buf.length) break
    const size = buf.readUInt32BE(i + 4)
    i += 8
    const end = Math.min(i + size, buf.length)
    out += buf.toString("utf8", i, end)
    i = end
  }
  // Fallback: if the buffer didn't have header frames, just treat as plain text
  if (!out) return buf.toString("utf8")
  return out
}

export type CreateContainerInput = {
  name: string // docker container name
  image: string
  envVars?: Record<string, string>
  portMappings?: { host: number; container: number; protocol?: "tcp" | "udp" }[]
  restartPolicy?: "no" | "always" | "unless-stopped" | "on-failure"
  extraLabels?: Record<string, string>
}

export async function createAndStartContainer(input: CreateContainerInput): Promise<string> {
  const docker = getDocker()

  // Pull the image first (idempotent — does nothing if already present)
  await new Promise<void>((resolve, reject) => {
    docker.pull(input.image, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err) return reject(err)
      docker.modem.followProgress(stream, (progressErr: Error | null) => {
        if (progressErr) return reject(progressErr)
        resolve()
      })
    })
  })

  const labels: Record<string, string> = {
    [MANAGED_LABEL]: "true",
    ...input.extraLabels,
  }

  const env = input.envVars
    ? Object.entries(input.envVars).map(([k, v]) => `${k}=${v}`)
    : undefined

  const portBindings: Record<string, Array<{ HostPort: string }>> = {}
  const exposedPorts: Record<string, object> = {}
  for (const mapping of input.portMappings ?? []) {
    const proto = mapping.protocol ?? "tcp"
    const key = `${mapping.container}/${proto}`
    portBindings[key] = [{ HostPort: String(mapping.host) }]
    exposedPorts[key] = {}
  }

  const container = await docker.createContainer({
    name: input.name,
    Image: input.image,
    Env: env,
    Labels: labels,
    ExposedPorts: exposedPorts,
    HostConfig: {
      PortBindings: portBindings,
      RestartPolicy: { Name: input.restartPolicy ?? "unless-stopped" },
    },
  })
  await container.start()
  return container.id
}
