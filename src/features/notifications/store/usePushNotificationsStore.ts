import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PushPermissionState, PushSupportState } from '../types'

interface PushNotificationsState {
  supportState: PushSupportState
  permission: PushPermissionState
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  currentToken: string | null
  lastSyncedToken: string | null
  lastSyncedUserId: string | null
  error: string | null
  isPromptDismissed: boolean
  setSupportState: (supportState: PushSupportState) => void
  setPermission: (permission: PushPermissionState) => void
  startSync: () => void
  setCurrentToken: (token: string | null) => void
  markSynced: (token: string, userId: string) => void
  markSyncError: (error: string) => void
  dismissPrompt: () => void
  resetPrompt: () => void
  resetRuntimeState: () => void
  resetState: () => void
}

const runtimeDefaults = {
  supportState: 'idle' as PushSupportState,
  permission: 'default' as PushPermissionState,
  syncStatus: 'idle' as const,
  lastSyncedToken: null,
  lastSyncedUserId: null,
  error: null,
  isPromptDismissed: false
}

export const usePushNotificationsStore = create<PushNotificationsState>()(
  persist(
    (set) => ({
      ...runtimeDefaults,
      currentToken: null,
      setSupportState: (supportState) => set({ supportState }),
      setPermission: (permission) => set({ permission }),
      startSync: () => set({ syncStatus: 'syncing', error: null }),
      setCurrentToken: (currentToken) => set({ currentToken }),
      markSynced: (token, userId) =>
        set({
          currentToken: token,
          lastSyncedToken: token,
          lastSyncedUserId: userId,
          syncStatus: 'synced',
          error: null
        }),
      markSyncError: (error) => set({ syncStatus: 'error', error }),
      dismissPrompt: () => set({ isPromptDismissed: true }),
      resetPrompt: () => set({ isPromptDismissed: false }),
      resetRuntimeState: () => set({ ...runtimeDefaults }),
      resetState: () => set({ ...runtimeDefaults, currentToken: null })
    }),
    {
      name: 'push-notifications-storage',
      partialize: (state) => ({
        currentToken: state.currentToken
      })
    }
  )
)
