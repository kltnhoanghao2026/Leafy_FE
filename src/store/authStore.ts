import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../features/auth/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  accountRole: "USER" | "ADMIN" | null;
  isLoading: boolean;
  rememberMe: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccountRole: (role: "USER" | "ADMIN" | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setRememberMe: (rememberMe: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      accountRole: null,
      isLoading: false,
      rememberMe: false,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAccountRole: (accountRole) => set({ accountRole }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setRememberMe: (rememberMe) => set({ rememberMe }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          accountRole: null,
          rememberMe: false,
        }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
