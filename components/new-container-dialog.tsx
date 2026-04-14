"use client"

import { useState } from "react"
import { X, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

type PortMapping = { host: string; container: string }
type EnvVar = { key: string; value: string }

export function NewContainerDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [ports, setPorts] = useState<PortMapping[]>([])
  const [envs, setEnvs] = useState<EnvVar[]>([])
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const reset = () => {
    setName("")
    setImage("")
    setPorts([])
    setEnvs([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name,
        image,
        portMappings: ports
          .filter((p) => p.host && p.container)
          .map((p) => ({ host: parseInt(p.host, 10), container: parseInt(p.container, 10) })),
        envVars: Object.fromEntries(envs.filter((e) => e.key).map((e) => [e.key, e.value])),
      }
      const res = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Erreur")
      toast.success("Container créé et démarré")
      reset()
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Nouveau container</h2>
            <p className="mt-0.5 text-xs text-neutral-500">L'image sera pullée puis démarrée.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <Field label="Nom" required>
            <input
              type="text"
              required
              pattern="[a-zA-Z0-9_.-]+"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="nginx-test"
              className={inputCls}
            />
          </Field>
          <Field label="Image Docker" required>
            <input
              type="text"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="nginx:alpine"
              className={inputCls}
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700">Ports (optionnel)</label>
              <button
                type="button"
                onClick={() => setPorts([...ports, { host: "", container: "" }])}
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                <Plus size={12} /> Ajouter
              </button>
            </div>
            {ports.length === 0 ? (
              <p className="text-xs text-neutral-500">Aucun port exposé — le container est uniquement accessible depuis le réseau Docker interne.</p>
            ) : (
              <div className="space-y-2">
                {ports.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      max={65535}
                      placeholder="host"
                      value={p.host}
                      onChange={(e) => {
                        const next = [...ports]
                        next[i] = { ...next[i], host: e.target.value }
                        setPorts(next)
                      }}
                      className={inputCls}
                    />
                    <span className="text-neutral-400">→</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={65535}
                      placeholder="container"
                      value={p.container}
                      onChange={(e) => {
                        const next = [...ports]
                        next[i] = { ...next[i], container: e.target.value }
                        setPorts(next)
                      }}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setPorts(ports.filter((_, j) => j !== i))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700">Variables d&apos;environnement (optionnel)</label>
              <button
                type="button"
                onClick={() => setEnvs([...envs, { key: "", value: "" }])}
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                <Plus size={12} /> Ajouter
              </button>
            </div>
            {envs.length > 0 && (
              <div className="space-y-2">
                {envs.map((e, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="KEY"
                      value={e.key}
                      onChange={(ev) => {
                        const next = [...envs]
                        next[i] = { ...next[i], key: ev.target.value }
                        setEnvs(next)
                      }}
                      className={inputCls}
                    />
                    <span className="text-neutral-400">=</span>
                    <input
                      type="text"
                      placeholder="value"
                      value={e.value}
                      onChange={(ev) => {
                        const next = [...envs]
                        next[i] = { ...next[i], value: ev.target.value }
                        setEnvs(next)
                      }}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setEnvs(envs.filter((_, j) => j !== i))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !name || !image}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Créer et démarrer
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
