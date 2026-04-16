import { create } from "zustand"
import type { Step, LeadStatus, Scoring, PipelineFilters } from "@/types"

interface PipelineState {
  filters: PipelineFilters
  setFilter: <K extends keyof PipelineFilters>(key: K, value: PipelineFilters[K]) => void
  resetFilters: () => void
  viewMode: "kanban" | "table"
  setViewMode: (mode: "kanban" | "table") => void
}

const defaultFilters: PipelineFilters = {
  search: "",
  step: "ALL",
  status: "ALL",
  scoring: "ALL",
  affiliateId: "ALL",
  dateFrom: null,
  dateTo: null,
}

export const usePipelineStore = create<PipelineState>()((set) => ({
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  viewMode: "kanban",
  setViewMode: (viewMode) => set({ viewMode }),
}))
