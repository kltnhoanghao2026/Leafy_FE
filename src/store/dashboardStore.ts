import { create } from 'zustand'

interface DashboardState {
  selectedZoneId: string
  setSelectedZoneId: (zoneId: string) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedZoneId: 'A', // default zone
  setSelectedZoneId: (zoneId) => set({ selectedZoneId: zoneId }),
}))
