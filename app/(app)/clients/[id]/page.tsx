import Link from "next/link"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, Pencil, Rocket, Globe, Mail, Phone, StickyNote } from "lucide-react"
import { Toaster } from "sonner"
import { db, clients, clientConfig } from "@/lib/db"
import { ClientStatusBadge } from "@/components/client-status-badge"
import { ClientStatusActions } from "@/components/client-status-actions"
import { InstanceBlock } from "@/components/instance-block"
import { getCurrentUser } from "@/lib/auth/server"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const currentUser = await getCurrentUser()
  const canWrite = currentUser?.role === "admin"
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
  if (!client) notFound()
  const [config] = await db.select().from(clientConfig).where(eq(clientConfig.clientId, id)).limit(1)

  return (
    <div>
      <Toaster position="top-center" />
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/clients"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-50"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          <p className="mt-0.5 text-sm text-neutral-500">{client.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <Link
              href={`/clients/${client.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <Pencil size={14} />
              Modifier
            </Link>
          )}
          <Link
            href={`/clients/${client.id}/deploy`}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <Rocket size={14} />
            Helper déploiement
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Informations" className="lg:col-span-2">
          <InfoRow icon={<Globe size={14} />} label="Domaine" value={client.domain} />
          <InfoRow icon={<Mail size={14} />} label="Contact" value={`${client.ownerName} — ${client.ownerEmail}`} />
          {client.ownerPhone && <InfoRow icon={<Phone size={14} />} label="Téléphone" value={client.ownerPhone} />}
          {client.notes && <InfoRow icon={<StickyNote size={14} />} label="Notes" value={client.notes} multiline />}
        </Card>

        <Card title="Statut">
          <div className="mb-3">
            <ClientStatusBadge status={client.status} />
          </div>
          <ClientStatusActions clientId={client.id} currentStatus={client.status} />
          <div className="mt-4 space-y-1 text-xs text-neutral-500">
            <p>
              Créé&nbsp;: <span className="text-neutral-700">{client.createdAt.toLocaleString("fr-FR")}</span>
            </p>
            {client.deployedAt && (
              <p>
                Déployé&nbsp;: <span className="text-neutral-700">{client.deployedAt.toLocaleString("fr-FR")}</span>
              </p>
            )}
          </div>
        </Card>

        <div className="lg:col-span-3">
          <InstanceBlock
            clientId={client.id}
            clientSlug={client.slug}
            publicUrl={client.publicUrl}
            composeProject={client.composeProject}
            canWrite={canWrite}
          />
        </div>

        {config && (
          <Card title="Config e-Snack (résumé)" className="lg:col-span-3">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <InfoRow label="Admin email" value={config.initialAdminEmail} />
              <InfoRow label="Admin name" value={config.initialAdminName} />
              <InfoRow label="Restaurant name" value={config.initialRestaurantName} />
              <InfoRow label="Restaurant slug" value={config.initialRestaurantSlug} />
              <InfoRow label="Email from" value={config.emailFromAddress} />
              <InfoRow label="Mollie" value={config.mollieApiKey ? "✅ configuré" : "— non configuré"} />
              <InfoRow label="Resend" value={config.resendApiKey ? "✅ configuré" : "— non configuré"} />
            </div>
            <p className="mt-4 text-xs text-neutral-500">
              Les secrets techniques (JWT, Postgres password, MinIO password) sont auto-générés et visibles dans le helper de déploiement.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  multiline,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div>
      <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {icon}
        {label}
      </p>
      <p className={`text-sm text-neutral-900 ${multiline ? "whitespace-pre-wrap" : "truncate"}`}>{value}</p>
    </div>
  )
}
