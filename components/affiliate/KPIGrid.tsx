import { cn } from "@/lib/utils"
import { Users, Handshake, TrendingUp, Wallet, CheckCircle, Clock } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type KPI = {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  accent?: "green" | "amber"
}

type Props = {
  leads: number
  deals: number
  conversion: number
  ca: number
  commissionsConfirmed: number
  commissionsPending: number
}

export function KPIGrid({
  leads,
  deals,
  conversion,
  ca,
  commissionsConfirmed,
  commissionsPending,
}: Props) {
  const kpis: KPI[] = [
    {
      label: "Leads",
      value: leads,
      icon: Users,
    },
    {
      label: "Deals conclus",
      value: deals,
      icon: Handshake,
      accent: "green",
    },
    {
      label: "Taux de conversion",
      value: `${conversion.toFixed(1)}%`,
      icon: TrendingUp,
    },
    {
      label: "Chiffre d'affaires",
      value: `${ca.toLocaleString("fr-FR")} EUR`,
      icon: Wallet,
    },
    {
      label: "Commissions confirmees",
      value: `${commissionsConfirmed.toLocaleString("fr-FR")} EUR`,
      icon: CheckCircle,
      accent: "green",
    },
    {
      label: "Commissions en attente",
      value: `${commissionsPending.toLocaleString("fr-FR")} EUR`,
      icon: Clock,
      accent: "amber",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {kpi.label}
            </span>
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                kpi.accent === "green"
                  ? "bg-green-100 text-green-600"
                  : kpi.accent === "amber"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-neutral-100 text-neutral-500",
              )}
            >
              <kpi.icon size={16} />
            </div>
          </div>
          <p
            className={cn(
              "mt-2 text-2xl font-bold",
              kpi.accent === "green"
                ? "text-green-600"
                : kpi.accent === "amber"
                  ? "text-amber-600"
                  : "text-neutral-900",
            )}
          >
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  )
}
