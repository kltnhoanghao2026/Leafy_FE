import { create } from "zustand";
import type { User } from "../features/auth/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  accountRole: "USER" | "ADMIN" | null;
  isLoading: boolean;
  rememberMe: boolean;
  /** True while the app is attempting a silent token refresh on startup */
  isInitializing: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string) => void;
  setAccountRole: (role: "USER" | "ADMIN" | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setRememberMe: (rememberMe: boolean) => void;
  setIsInitializing: (isInitializing: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  accountRole: null,
  isLoading: false,
  rememberMe: false,
  isInitializing: true,
  setUser: (user) => set({ user }),
  setTokens: (accessToken) => set({ accessToken }),
  setAccountRole: (accountRole) => set({ accountRole }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setRememberMe: (rememberMe) => set({ rememberMe }),
  setIsInitializing: (isInitializing) => set({ isInitializing }),
  logout: () =>
    set({
      user: null,
      accessToken: null,
      accountRole: null,
      rememberMe: false,
      isInitializing: false,
    }),
}));
