import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      dark: false,
      user: null,
      billing: "monthly",
      sidebarOpen: false,
      sidebarCollapsed: false,
      setBilling: (billing) => set({ billing }),
      toggleDark: () => set((state) => ({ dark: !state.dark })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "eksaha-app",
      partialize: ({ dark, user, sidebarCollapsed }) => ({ dark, user, sidebarCollapsed }),
    },
  ),
);
