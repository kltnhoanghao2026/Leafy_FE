import { create } from 'zustand'
import type { User } from '../features/auth/types.ts'

interface AuthState {
  user: User | null
  isLoading: boolean
  rememberMe: boolean
  setUser: (user: User | null) => void
  setIsLoading: (isLoading: boolean) => void
  setRememberMe: (rememberMe: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  rememberMe: false,
  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setRememberMe: (rememberMe) => set({ rememberMe }),
  logout: () => set({ user: null, rememberMe: false })
}))
