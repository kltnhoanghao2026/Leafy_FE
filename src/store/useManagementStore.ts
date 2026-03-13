import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_DEVICES_DATA } from '../features/device-management/mockDevices'
import type { FarmInfo, Zone, Sensor } from '../features/device-management/mockDevices'

interface ManagementState {
  // Data
  farmInfo: FarmInfo
  zones: Zone[]
  devices: Sensor[]
  
  // Actions
  updateFarmInfo: (data: Partial<FarmInfo>) => void
  addZone: (zone: Zone) => void
  updateZone: (id: string, data: Partial<Zone>) => void
  deleteZone: (id: string) => void
  addDevice: (device: Sensor) => void
  updateDevice: (id: string, data: Partial<Sensor>) => void
  deleteDevice: (id: string) => void
}

export const useManagementStore = create<ManagementState>()(
  persist(
    (set) => ({
      farmInfo: MOCK_DEVICES_DATA.farmInfo,
      zones: MOCK_DEVICES_DATA.zones,
      devices: MOCK_DEVICES_DATA.sensors,

      updateFarmInfo: (data) =>
        set((state) => ({ farmInfo: { ...state.farmInfo, ...data } })),

      addZone: (zone) =>
        set((state) => ({ zones: [...state.zones, zone] })),

      updateZone: (id, data) =>
        set((state) => ({
          zones: state.zones.map((z) => (z.id === id ? { ...z, ...data } : z))
        })),

      deleteZone: (id) =>
        set((state) => ({
          zones: state.zones.filter((z) => z.id !== id)
        })),

      addDevice: (device) =>
        set((state) => ({ devices: [...state.devices, device] })),

      updateDevice: (id, data) =>
        set((state) => ({
          devices: state.devices.map((d) => (d.id === id ? { ...d, ...data } : d))
        })),

      deleteDevice: (id) =>
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== id)
        }))
    }),
    {
      name: 'management-storage',
    }
  )
)
