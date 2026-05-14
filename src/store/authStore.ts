import { create } from "zustand";
import type { User } from "../features/auth/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  accountRole: "USER" | "ADMIN" | null;
  isLoading: boolean;
  rememberMe: boolean;
  /** True while the app is attempting a silent token refresh on startup */
  isInitializing: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken?: string | null) => void;
  setAccountRole: (role: "USER" | "ADMIN" | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setRememberMe: (rememberMe: boolean) => void;
  setIsInitializing: (isInitializing: boolean) => void;
  logout: () => void;
}

const REFRESH_TOKEN_STORAGE_KEY = "leafy_refresh_token";

const canUseBrowserStorage = () => typeof window !== "undefined";

const getStoredRefreshToken = () => {
  if (!canUseBrowserStorage()) return null;

  return (
    window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) ||
    window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  );
};

const hasRememberedRefreshToken = () => {
  if (!canUseBrowserStorage()) return false;

  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) !== null;
};

const persistRefreshToken = (
  refreshToken: string | null,
  rememberMe: boolean,
) => {
  if (!canUseBrowserStorage()) return;

  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

  if (!refreshToken) return;

  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: getStoredRefreshToken(),
  accountRole: null,
  isLoading: false,
  rememberMe: hasRememberedRefreshToken(),
  isInitializing: true,
  setUser: (user) => set({ user }),
  setTokens: (accessToken, refreshToken) => {
    if (refreshToken !== undefined) {
      persistRefreshToken(refreshToken, get().rememberMe);
      set({ accessToken, refreshToken });
      return;
    }

    set({ accessToken });
  },
  setAccountRole: (accountRole) => set({ accountRole }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setRememberMe: (rememberMe) => {
    persistRefreshToken(get().refreshToken, rememberMe);
    set({ rememberMe });
  },
  setIsInitializing: (isInitializing) => set({ isInitializing }),
  logout: () => {
    persistRefreshToken(null, false);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      accountRole: null,
      rememberMe: false,
      isInitializing: false,
    });
  },
}));
