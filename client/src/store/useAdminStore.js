import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialUsers = [
  { id: 1, name: "Maya Chen", email: "maya@northstar.co", plan: "Growth", status: "Active", joined: "Jun 8, 2026" },
  { id: 2, name: "Ethan Brooks", email: "ethan@alder.co", plan: "Enterprise", status: "Active", joined: "Jun 7, 2026" },
  { id: 3, name: "Priya Shah", email: "priya@layerpath.io", plan: "Starter", status: "Trial", joined: "Jun 5, 2026" },
  { id: 4, name: "Leo Martin", email: "leo@modulo.dev", plan: "Growth", status: "Past due", joined: "Jun 3, 2026" },
  { id: 5, name: "Sara Kim", email: "sara@brightway.co", plan: "Growth", status: "Active", joined: "May 30, 2026" },
];

const initialTickets = [
  { id: "NX-1048", subject: "DNS records for launch", user: "Maya Chen", priority: "High", status: "In Progress", assignee: "Amelia" },
  { id: "NX-1046", subject: "Facebook pixel issue", user: "Leo Martin", priority: "Critical", status: "Open", assignee: "Unassigned" },
  { id: "NX-1042", subject: "New user onboarding", user: "Sara Kim", priority: "Low", status: "Resolved", assignee: "Noah" },
];

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)+/g, "");

const today = () => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date());

const normalizePost = (post) => ({
  slug: slugify(post.slug || post.title || `post-${Date.now()}`),
  excerpt: post.excerpt || "A fresh insight from the Nextexa Lab team.",
  content: post.content || post.excerpt || "This post is ready for content.",
  category: post.category || "Insights",
  status: post.status || "Draft",
  updated: post.updated || today(),
  read: post.read || "4 min",
  ...post,
});

export const useAdminStore = create(
  persist(
    (set) => ({
      users: initialUsers,
      tickets: initialTickets,
      services: [
        { id: 1, name: "SEO", owner: "Lina", activeClients: 82, status: "Active" },
        { id: 2, name: "Web Services", owner: "Noah", activeClients: 71, status: "Active" },
        { id: 3, name: "IT Support", owner: "Sam", activeClients: 59, status: "Active" },
        { id: 4, name: "Digital Ads", owner: "Amelia", activeClients: 47, status: "Paused" },
      ],
      posts: [
        { id: 1, title: "Technical SEO checklist", slug: "technical-seo-checklist-admin", excerpt: "A launch checklist for technical SEO quality control.", content: "Use this checklist before publishing important pages.", category: "SEO", status: "Published", updated: "May 28, 2026", read: "7 min" },
        { id: 2, title: "Subscription digital teams", slug: "subscription-digital-teams-admin", excerpt: "How subscription support compares with agencies and hires.", content: "Subscription teams can reduce coordination costs while keeping momentum high.", category: "Strategy", status: "Draft", updated: "May 15, 2026", read: "5 min" },
      ],
      invoices: [
        { id: "INV-3051", customer: "Northstar", amount: "$999.00", status: "Paid", date: "Jun 8, 2026" },
        { id: "INV-3050", customer: "Alder & Co.", amount: "$1,999.00", status: "Open", date: "Jun 7, 2026" },
      ],
      notifications: [
        { id: "admin-note-1", title: "Critical ticket awaiting assignment", time: "Today", read: false, href: "/admin/tickets" },
      ],
      settings: { company: "Nextexa Lab", email: "support@nextexa.lab", currency: "USD", role: "Support Agent" },
      addUser: (user) => set((state) => ({ users: [{ id: Date.now(), joined: "Jun 12, 2026", status: "Active", ...user }, ...state.users] })),
      updateUser: (id, changes) => set((state) => ({ users: state.users.map((user) => user.id === id ? { ...user, ...changes } : user) })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter((user) => user.id !== id) })),
      updateTicket: (id, changes) => set((state) => ({ tickets: state.tickets.map((ticket) => ticket.id === id ? { ...ticket, ...changes } : ticket) })),
      ingestTickets: (incomingTickets) => set((state) => {
        const localById = new Map(state.tickets.map((ticket) => [ticket.id, ticket]));
        const mergedIncoming = incomingTickets.map((ticket) => ({ ...ticket, ...localById.get(ticket.id), ...ticket }));
        const incomingIds = new Set(incomingTickets.map((ticket) => ticket.id));
        const localOnly = state.tickets.filter((ticket) => !incomingIds.has(ticket.id));
        const newUserTickets = incomingTickets.filter((ticket) => ticket.source === "User dashboard" && !state.tickets.some((item) => item.id === ticket.id));

        return {
          tickets: [...mergedIncoming, ...localOnly],
          notifications: [
            ...newUserTickets.map((ticket) => ({
              id: `ticket-${ticket.id}`,
              title: `New ${ticket.priority} ticket: ${ticket.subject}`,
              time: ticket.createdAt || "Just now",
              read: false,
              href: "/admin/tickets",
            })),
            ...state.notifications,
          ],
        };
      }),
      receiveUserTicket: (ticket) => set((state) => {
        const adminTicket = {
          id: ticket.id,
          subject: ticket.subject,
          user: ticket.user || "Jordan Lee",
          priority: ticket.priority || "Medium",
          status: "Open",
          assignee: "Unassigned",
          source: "User dashboard",
          createdAt: "Just now",
        };

        return {
          tickets: [adminTicket, ...state.tickets.filter((item) => item.id !== ticket.id)],
          notifications: [{
            id: `ticket-${ticket.id}`,
            title: `New ${adminTicket.priority} ticket: ${adminTicket.subject}`,
            time: "Just now",
            read: false,
            href: "/admin/tickets",
          }, ...state.notifications],
        };
      }),
      markAdminNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((item) => ({ ...item, read: true })),
      })),
      addRecord: (collection, record) => set((state) => ({
        [collection]: [{ id: Date.now(), ...(collection === "posts" ? normalizePost(record) : record) }, ...state[collection]],
      })),
      updateRecord: (collection, id, changes) => set((state) => ({
        [collection]: state[collection].map((item) => item.id === id
          ? { ...item, ...(collection === "posts" ? normalizePost({ ...item, ...changes }) : changes) }
          : item),
      })),
      deleteRecord: (collection, id) => set((state) => ({ [collection]: state[collection].filter((item) => item.id !== id) })),
      ingestPosts: (posts) => set({ posts }),
      updateSettings: (settings) => set({ settings }),
    }),
    { name: "nextexa-admin-dashboard" },
  ),
);
