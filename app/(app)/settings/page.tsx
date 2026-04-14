import { desc } from "drizzle-orm"
import { Toaster } from "sonner"
import { db, user } from "@/lib/db"
import { AdminList } from "@/components/admin-list"

export default async function SettingsPage() {
  const admins = await db.select().from(user).orderBy(desc(user.createdAt))

  return (
    <div>
      <Toaster position="top-center" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Réglages</h1>
        <p className="mt-1 text-sm text-neutral-500">Gestion des membres de l'équipe Klinkragency.</p>
      </div>

      <AdminList
        admins={admins.map((a) => ({
          id: a.id,
          email: a.email,
          name: a.name,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
