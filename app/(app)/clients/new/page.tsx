import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ClientForm } from "@/components/client-form"
import { Toaster } from "sonner"
import { getCurrentUser } from "@/lib/auth/server"

export default async function NewClientPage() {
  const currentUser = await getCurrentUser()
  if (currentUser?.role !== "admin") redirect("/clients")
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouveau client</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Les secrets techniques (JWT, Postgres) sont générés automatiquement.</p>
        </div>
      </div>
      <ClientForm mode="create" />
    </div>
  )
}
