"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, UserPlus, Ban, ShieldCheck, Shield, LogOut, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/client"
import { cn } from "@/lib/utils"

type Admin = {
  id: string
  email: string
  name: string
  role: string
  banned: boolean
  banReason: string | null
  banExpires: string | null
  createdAt: string
}

type Props = {
  admins: Admin[]
  currentUserId: string | null
  currentIsSuperAdmin: boolean
}

export function AdminList({ admins, currentUserId, currentIsSuperAdmin }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"admin" | "user">("user")
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = () => {
    router.refresh()
    setBusyId(null)
  }

  const runAction = async (userId: string, fn: () => Promise<unknown>, successMsg: string) => {
    setBusyId(userId)
    try {
      await fn()
      toast.success(successMsg)
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
      setBusyId(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur")
      toast.success("Membre ajouté")
      setEmail("")
      setName("")
      setRole("user")
      setShowForm(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (admin: Admin) => {
    if (!confirm(`Supprimer ${admin.email} ? Cette action est irréversible.`)) return
    runAction(
      admin.id,
      async () => {
        const res = await fetch(`/api/admins?id=${admin.id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Échec de la suppression")
      },
      "Membre supprimé"
    )
  }

  const handleBan = (admin: Admin) => {
    const reason = prompt("Raison du bannissement (optionnel)", "") || undefined
    runAction(
      admin.id,
      () => authClient.admin.banUser({ userId: admin.id, banReason: reason }),
      `${admin.email} banni`
    )
  }

  const handleUnban = (admin: Admin) => {
    runAction(admin.id, () => authClient.admin.unbanUser({ userId: admin.id }), `${admin.email} débanni`)
  }

  const handleDisconnect = (admin: Admin) => {
    if (!confirm(`Révoquer toutes les sessions de ${admin.email} ? L'utilisateur sera déconnecté immédiatement.`)) return
    runAction(
      admin.id,
      () => authClient.admin.revokeUserSessions({ userId: admin.id }),
      `Sessions de ${admin.email} révoquées`
    )
  }

  const handleToggleRole = (admin: Admin) => {
    const newRole = admin.role === "admin" ? "user" : "admin"
    runAction(
      admin.id,
      () => authClient.admin.setRole({ userId: admin.id, role: newRole }),
      `Rôle changé → ${newRole}`
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Membres</h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            {admins.length} membre{admins.length > 1 ? "s" : ""} autorisé{admins.length > 1 ? "s" : ""} à se connecter.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          <Plus size={13} />
          Inviter un membre
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="border-b border-neutral-100 bg-neutral-50 px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="email"
              required
              placeholder="email@klinkragency.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            />
            <input
              type="text"
              required
              placeholder="Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "user")}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            >
              <option value="user">user — lecture seule</option>
              <option value="admin">admin — accès complet</option>
            </select>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Ajouter
            </button>
          </div>
        </form>
      )}

      <ul className="divide-y divide-neutral-100">
        {admins.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-neutral-500">
            Aucun membre. Ajoute au moins ton email pour pouvoir te connecter.
          </li>
        )}
        {admins.map((admin) => {
          const isSelf = admin.id === currentUserId
          const busy = busyId === admin.id
          const canModerate = currentIsSuperAdmin && !isSelf

          return (
            <li key={admin.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-neutral-900">{admin.name}</p>
                    <RoleBadge role={admin.role} />
                    {admin.banned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        <Ban size={9} /> Banni
                      </span>
                    )}
                    {isSelf && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                        Vous
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-neutral-500">
                    {admin.email}
                    {admin.banned && admin.banReason ? ` · ${admin.banReason}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {canModerate && (
                  <>
                    <IconBtn
                      title={admin.role === "admin" ? "Rétrograder en user" : "Promouvoir admin"}
                      onClick={() => handleToggleRole(admin)}
                      disabled={busy}
                      icon={admin.role === "admin" ? <Shield size={13} /> : <ShieldCheck size={13} />}
                    />
                    <IconBtn
                      title="Déconnecter toutes les sessions"
                      onClick={() => handleDisconnect(admin)}
                      disabled={busy}
                      icon={<LogOut size={13} />}
                    />
                    {admin.banned ? (
                      <IconBtn
                        title="Débannir"
                        onClick={() => handleUnban(admin)}
                        disabled={busy}
                        icon={<RotateCcw size={13} />}
                        className="text-green-600 hover:bg-green-50"
                      />
                    ) : (
                      <IconBtn
                        title="Bannir"
                        onClick={() => handleBan(admin)}
                        disabled={busy}
                        icon={<Ban size={13} />}
                        className="text-amber-600 hover:bg-amber-50"
                      />
                    )}
                  </>
                )}
                {!isSelf && (
                  <IconBtn
                    title="Supprimer"
                    onClick={() => handleDelete(admin)}
                    disabled={busy}
                    icon={busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    className="text-red-500 hover:bg-red-50"
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        isAdmin ? "bg-black text-white" : "bg-neutral-100 text-neutral-700"
      )}
    >
      {role}
    </span>
  )
}

function IconBtn({
  title,
  onClick,
  disabled,
  icon,
  className = "",
}: {
  title: string
  onClick: () => void
  disabled: boolean
  icon: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50",
        className
      )}
    >
      {icon}
    </button>
  )
}
