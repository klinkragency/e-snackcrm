"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

type Admin = { id: string; email: string; name: string; createdAt: string }

export function AdminList({ admins }: { admins: Admin[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur")
      toast.success("Membre ajouté")
      setEmail("")
      setName("")
      setShowForm(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Retirer ce membre ? Il ne pourra plus se connecter.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admins?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Échec de la suppression")
      toast.success("Membre retiré")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setDeletingId(null)
    }
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">{admin.name}</p>
              <p className="text-xs text-neutral-500">{admin.email}</p>
            </div>
            <button
              onClick={() => handleDelete(admin.id)}
              disabled={deletingId === admin.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              title="Retirer"
            >
              {deletingId === admin.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
