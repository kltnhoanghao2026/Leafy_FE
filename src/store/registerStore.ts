import { create } from 'zustand'
import type { RegisterFormInputs } from '../features/auth/types'

const PENDING_EMAIL_KEY = 'pending-verify-email'

// --- sessionStorage helpers for pendingEmail ---
export function getPendingEmail (): string | null {
  return sessionStorage.getItem(PENDING_EMAIL_KEY)
}

export function setPendingEmailSession (email: string): void {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email)
}

export function clearPendingEmail (): void {
  sessionStorage.removeItem(PENDING_EMAIL_KEY)
}

// --- Zustand store for register form state ---
interface RegisterState {
  formData: Partial<RegisterFormInputs>
  isLoading: boolean
  error: string | null
  agreedToTerms: boolean
  setFormData: (data: Partial<RegisterFormInputs>) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setAgreedToTerms: (agreed: boolean) => void
  reset: () => void
}

const initialState = {
  formData: {
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  },
  isLoading: false,
  error: null,
  agreedToTerms: false
}

export const useRegisterStore = create<RegisterState>((set) => ({
  ...initialState,
  setFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setAgreedToTerms: (agreedToTerms) =>
    set((state) => ({ formData: { ...state.formData, agreedToTerms }, agreedToTerms })),
  reset: () => set(initialState)
}))
