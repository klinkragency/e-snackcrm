import Link from "next/link"
import { desc } from "drizzle-orm"
import { Plus, Store } from "lucide-react"
import { db, clients } from "@/lib/db"
import { ClientStatusBadge } from "@/components/client-status-badge"
import { getCurrentUser } from "@/lib/auth/server"

export default async function ClientsPage() {
  const currentUser = await getCurrentUser()
  const canWrite = currentUser?.role === "admin"
  const list = await db.select().from(clients).orderBy(desc(clients.createdAt))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {list.length === 0
              ? "Aucun client pour l'instant"
              : `${list.length} client${list.length > 1 ? "s" : ""}`}
            {!canWrite && (
              <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-700">
                Lecture seule
              </span>
            )}
          </p>
        </div>
        {canWrite && (
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <Plus size={16} />
            Nouveau client
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState canWrite={canWrite} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-3 text-left font-semibold">Client</th>
                <th className="px-5 py-3 text-left font-semibold">Domaine</th>
                <th className="px-5 py-3 text-left font-semibold">Statut</th>
                <th className="px-5 py-3 text-left font-semibold">Créé</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-5 py-4">
                    <Link href={`/clients/${c.id}`} className="block">
                      <p className="font-medium text-neutral-900">{c.name}</p>
                      <p className="text-xs text-neutral-500">{c.slug}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/clients/${c.id}`} className="block text-sm text-neutral-700">
                      {c.domain}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/clients/${c.id}`} className="block">
                      <ClientStatusBadge status={c.status} />
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-xs text-neutral-500">
                    {c.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function EmptyState({ canWrite }: { canWrite: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white/50 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
        <Store size={20} className="text-neutral-400" />
      </div>
      <p className="text-sm font-medium text-neutral-900">
        {canWrite ? "Ton premier client arrive" : "Aucun client enregistré"}
      </p>
      {canWrite && (
        <>
          <p className="mt-1 text-xs text-neutral-500">
            Ajoute un client pour stocker sa config et générer ses commandes de déploiement.
          </p>
          <Link
            href="/clients/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <Plus size={13} />
            Ajouter un client
          </Link>
        </>
      )}
    </div>
  )
}
