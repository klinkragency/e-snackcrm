import Link from "next/link"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, Rocket } from "lucide-react"
import { Toaster } from "sonner"
import { db, clients, clientConfig } from "@/lib/db"
import {
  buildEnvFile,
  buildInitialDeployScript,
  buildUpdateScript,
  buildDebugScript,
  buildRollbackScript,
  buildUninstallScript,
} from "@/lib/deploy-commands"
import { DeployHelper } from "@/components/deploy-helper"

export default async function DeployPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
  if (!client) notFound()
  const [config] = await db.select().from(clientConfig).where(eq(clientConfig.clientId, id)).limit(1)
  if (!config) notFound()

  const tabs = [
    { key: "env", label: ".env", content: buildEnvFile(client, config) },
    { key: "initial", label: "Déploiement initial", content: buildInitialDeployScript(client, config) },
    { key: "update", label: "Mise à jour", content: buildUpdateScript(client) },
    { key: "debug", label: "Debug", content: buildDebugScript(client) },
    { key: "rollback", label: "Rollback", content: buildRollbackScript(client) },
    { key: "uninstall", label: "Supprimer", content: buildUninstallScript(client) },
  ]

  return (
    <div>
      <Toaster position="top-center" />
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/clients/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-50"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Rocket size={20} /> Helper déploiement
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {client.name} · <span className="font-medium">{client.domain}</span>
          </p>
        </div>
      </div>

      <DeployHelper tabs={tabs} />
    </div>
  )
}
