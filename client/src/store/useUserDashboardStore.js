import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserDashboardStore = create(
  persist(
    (set) => ({
      notifications: [
        { id: 2, title: "June invoice paid", time: "11 days ago", read: false },
        { id: 3, title: "Roadmap review available", time: "2 weeks ago", read: true },
      ],
      markNotificationsRead: () => set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, read: true })) })),
    }),
    { name: "eksaha-user-dashboard" },
  ),
);
