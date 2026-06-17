import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialTickets = [
  { id: "NX-1048", subject: "DNS records for product launch", priority: "High", status: "In Progress", updated: "20 min ago", messages: ["We are reviewing the launch records now."] },
  { id: "NX-1031", subject: "GA4 conversion event setup", priority: "Medium", status: "Open", updated: "Yesterday", messages: ["Please configure the new signup event."] },
  { id: "NX-1012", subject: "New team member onboarding", priority: "Low", status: "Resolved", updated: "May 24", messages: ["The account is ready."] },
];

export const useUserDashboardStore = create(
  persist(
    (set) => ({
      tickets: initialTickets,
      profile: { name: "Jordan Lee", email: "user@nextexa.dev", company: "Northstar Labs", timezone: "Eastern Time (US)" },
      paymentMethod: { brand: "Visa", last4: "4242", expiry: "08/28" },
      notifications: [
        { id: 1, title: "Ticket NX-1048 updated", time: "20 minutes ago", read: false },
        { id: 2, title: "June invoice paid", time: "11 days ago", read: false },
        { id: 3, title: "Roadmap review available", time: "2 weeks ago", read: true },
      ],
      createTicket: (ticket) => set((state) => ({
        tickets: [{ id: ticket.id || `NX-${1050 + state.tickets.length}`, status: "Open", updated: "Just now", messages: [ticket.message], ...ticket }, ...state.tickets],
      })),
      replyTicket: (id, message) => set((state) => ({
        tickets: state.tickets.map((ticket) => ticket.id === id
          ? { ...ticket, updated: "Just now", status: ticket.status === "Resolved" ? "Open" : ticket.status, messages: [...ticket.messages, message] }
          : ticket),
      })),
      updateProfile: (profile) => set({ profile }),
      updatePaymentMethod: (paymentMethod) => set({ paymentMethod }),
      markNotificationsRead: () => set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, read: true })) })),
    }),
    { name: "nextexa-user-dashboard" },
  ),
);
