import { create } from 'zustand'
import type { ProfileResponse } from '../types'
import { apiGetMyProfile, apiUpdateProfileByUserId } from '../services/profileApi'

export interface SettingsState {
  profile: ProfileResponse | null
  isLoading: boolean
  isSaving: boolean
  hasError: string | null
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  resetProfile: () => void
  fetchProfile: () => Promise<void>
  updateProfile: (data: { avatar?: string, bio?: string, specialty?: string }) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  profile: null,
  isLoading: false,
  isSaving: false,
  hasError: null,
  theme: 'light',

  setTheme: (theme) => set({ theme }),
  resetProfile: () => set({ profile: null, isLoading: false, isSaving: false, hasError: null }),

  fetchProfile: async () => {
    set({ isLoading: true, hasError: null })
    try {
      const res = await apiGetMyProfile()
      if (res.data) {
        set({ profile: res.data })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ'
      set({ hasError: message })
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (data) => {
    const { profile } = get()
    if (!profile) return

    set({ isSaving: true, hasError: null })
    try {
      const res = await apiUpdateProfileByUserId(profile.userId, data)
      if (res.data) {
        set({ profile: res.data })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ'
      set({ hasError: message })
      throw err
    } finally {
      set({ isSaving: false })
    }
  }
}))
