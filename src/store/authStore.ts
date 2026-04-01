import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../features/auth/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  rememberMe: boolean
  setUser: (user: User | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setIsLoading: (isLoading: boolean) => void
  setRememberMe: (rememberMe: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      rememberMe: false,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setRememberMe: (rememberMe) => set({ rememberMe }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, rememberMe: false })
    }),
    {
      name: 'auth-storage'
    }
  )
)
