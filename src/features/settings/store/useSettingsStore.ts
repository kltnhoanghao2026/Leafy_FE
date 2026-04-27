import { create } from "zustand";

export type ThemeMode = "light" | "dark";

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export interface SettingsState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resetProfile: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "light",

  setTheme: (theme) => {
    applyThemeToDocument(theme);
    set({ theme });
  },
  resetProfile: () => {
    // Profile data is now managed by TanStack Query.
    // Cache clearing happens in useLogout via queryClient.clear().
  },
}));
