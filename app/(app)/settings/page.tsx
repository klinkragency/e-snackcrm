import { desc } from "drizzle-orm"
import { Toaster } from "sonner"
import { db, user } from "@/lib/db"
import { getCurrentUser, isSuperAdmin } from "@/lib/auth/server"
import { AdminList } from "@/components/admin-list"

export default async function SettingsPage() {
  const currentUser = await getCurrentUser()
  const admins = await db.select().from(user).orderBy(desc(user.createdAt))
  const currentIsSuperAdmin = isSuperAdmin(currentUser?.email)

  return (
    <div>
      <Toaster position="top-center" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Réglages</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestion des membres de l&apos;équipe Klinkragency.
          {currentIsSuperAdmin && (
            <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700">
              Super admin
            </span>
          )}
        </p>
      </div>

      <AdminList
        admins={admins.map((a) => ({
          id: a.id,
          email: a.email,
          name: a.name,
          role: a.role,
          banned: a.banned,
          banReason: a.banReason,
          banExpires: a.banExpires ? a.banExpires.toISOString() : null,
          createdAt: a.createdAt.toISOString(),
        }))}
        currentUserId={currentUser?.id ?? null}
        currentIsSuperAdmin={currentIsSuperAdmin}
      />
    </div>
  )
}
