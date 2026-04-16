"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "default"
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel()
      }}
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          {variant === "danger" && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50",
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-black hover:bg-neutral-800",
            )}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
