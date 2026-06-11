import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      dark: false,
      user: null,
      billing: "monthly",
      sidebarOpen: false,
      setBilling: (billing) => set({ billing }),
      toggleDark: () => set((state) => ({ dark: !state.dark })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      login: (email) =>
        set({
          user: {
            name: email.startsWith("admin") ? "Alex Morgan" : "Jordan Lee",
            email,
            role: email.startsWith("admin") ? "admin" : "user",
            plan: "Growth",
          },
        }),
      logout: () => set({ user: null }),
    }),
    { name: "nextexa-app", partialize: ({ dark, user }) => ({ dark, user }) },
  ),
);
