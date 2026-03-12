import { create } from 'zustand'
import type { RegisterFormInputs } from '../features/auth/types'

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
    fullName: '',
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
