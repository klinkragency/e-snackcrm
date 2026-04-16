"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Comment = {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  createdAt: string
}

type Props = {
  leadId: string
  comments: Comment[]
  currentUserId: string
  onCommentAdded?: () => void
}

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"

export function CommentsThread({
  leadId,
  comments,
  currentUserId,
  onCommentAdded,
}: Props) {
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)

  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed) return

    setSending(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      setContent("")
      toast.success("Commentaire ajoute")
      onCommentAdded?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Thread */}
      <div className="space-y-4">
        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-400">
            Aucun commentaire. Soyez le premier !
          </p>
        )}
        {sorted.map((comment) => {
          const isOwn = comment.authorId === currentUserId
          return (
            <div
              key={comment.id}
              className={cn("flex gap-3", isOwn && "flex-row-reverse")}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600"
              >
                {comment.authorName.charAt(0).toUpperCase()}
              </div>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5",
                  isOwn
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700",
                )}
              >
                <div className="mb-0.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isOwn ? "text-neutral-300" : "text-neutral-500",
                    )}
                  >
                    {comment.authorName}
                  </span>
                  <span
                    className={cn(
                      "text-[10px]",
                      isOwn ? "text-neutral-400" : "text-neutral-400",
                    )}
                  >
                    {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Send form */}
      <div className="mt-4 flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajouter un commentaire..."
          rows={2}
          className={cn(inputCls, "flex-1 resize-none")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !content.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  )
}
