import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"
import { Toaster } from "sonner"
import { db, clients, clientConfig } from "@/lib/db"
import { ClientForm, type ClientFormValues } from "@/components/client-form"
import { getCurrentUser } from "@/lib/auth/server"

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const currentUser = await getCurrentUser()
  if (currentUser?.role !== "admin") redirect(`/clients/${id}`)
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1)
  if (!client) notFound()
  const [config] = await db.select().from(clientConfig).where(eq(clientConfig.clientId, id)).limit(1)

  const initialValues: Partial<ClientFormValues> = {
    name: client.name,
    slug: client.slug,
    domain: client.domain,
    ownerName: client.ownerName,
    ownerEmail: client.ownerEmail,
    ownerPhone: client.ownerPhone ?? "",
    notes: client.notes ?? "",
    initialAdminEmail: config?.initialAdminEmail ?? "",
    initialAdminPassword: config?.initialAdminPassword ?? "",
    initialAdminName: config?.initialAdminName ?? "",
    initialRestaurantName: config?.initialRestaurantName ?? "",
    initialRestaurantSlug: config?.initialRestaurantSlug ?? "",
    mollieApiKey: config?.mollieApiKey ?? "",
    resendApiKey: config?.resendApiKey ?? "",
    emailFromAddress: config?.emailFromAddress ?? "",
  }

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier {client.name}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{client.slug}</p>
        </div>
      </div>
      <ClientForm mode="edit" clientId={id} initialValues={initialValues} />
    </div>
  )
}
