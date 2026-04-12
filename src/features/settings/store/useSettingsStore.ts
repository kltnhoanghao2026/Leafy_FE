import { create } from "zustand";

export interface SettingsState {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  resetProfile: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "light",

  setTheme: (theme) => set({ theme }),
  resetProfile: () => {
    // Profile data is now managed by TanStack Query.
    // Cache clearing happens in useLogout via queryClient.clear().
  },
}));
