import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserDashboardStore = create(
  persist(
    (set) => ({
      profile: { name: "Jordan Lee", email: "user@eksaha.dev", company: "Northstar Labs", timezone: "Eastern Time (US)" },
      paymentMethod: { brand: "Visa", last4: "4242", expiry: "08/28" },
      notifications: [
        { id: 2, title: "June invoice paid", time: "11 days ago", read: false },
        { id: 3, title: "Roadmap review available", time: "2 weeks ago", read: true },
      ],
      updateProfile: (profile) => set({ profile }),
      updatePaymentMethod: (paymentMethod) => set({ paymentMethod }),
      markNotificationsRead: () => set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, read: true })) })),
    }),
    { name: "eksaha-user-dashboard" },
  ),
);
