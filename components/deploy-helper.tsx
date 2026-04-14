"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function DeployHelper({ tabs }: { tabs: { key: string; label: string; content: string }[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "")
  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0]
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!active) return
    await navigator.clipboard.writeText(active.content)
    setCopied(true)
    toast.success("Copié dans le presse-papier")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!active) return null

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-100 px-2 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveKey(tab.key)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeKey === tab.key
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative">
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <pre className="max-h-[70vh] overflow-auto rounded-b-2xl bg-neutral-950 p-6 pr-24 text-xs leading-relaxed text-neutral-100">
          <code>{active.content}</code>
        </pre>
      </div>
    </div>
  )
}
