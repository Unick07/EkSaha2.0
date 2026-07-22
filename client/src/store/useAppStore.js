import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/http/api";

const getSystemTheme = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: getSystemTheme(),
      themePreference: "system",
      user: null,
      sessionChecked: false,
      billing: "monthly",
      sidebarOpen: false,
      sidebarCollapsed: false,
      setBilling: (billing) => set({ billing }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === "dark" ? "light" : "dark",
        themePreference: "manual",
      })),
      syncThemeWithSystem: (theme) => {
        const state = get();
        if (state.themePreference === "system" && state.theme !== theme) set({ theme });
      },
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      login: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem("accessToken");
        set({ user: null });
      },
      // Runs once on app startup: verifies the cached user against the server
      // (api's interceptor silently refreshes an expired access token first)
      // instead of trusting the persisted `user` object indefinitely.
      restoreSession: async () => {
        if (get().sessionChecked) return;
        const token = localStorage.getItem("accessToken");
        if (!token) {
          set({ user: null, sessionChecked: true });
          return;
        }
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data, sessionChecked: true });
        } catch {
          localStorage.removeItem("accessToken");
          set({ user: null, sessionChecked: true });
        }
      },
    }),
    {
      name: "eksaha-app",
      partialize: ({ theme, themePreference, user, sidebarCollapsed }) => ({ theme, themePreference, user, sidebarCollapsed }),
    },
  ),
);
