import { create } from "zustand";
import { persist } from "zustand/middleware";

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)+/g, "");

const today = () => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date());

const normalizePost = (post) => ({
  slug: slugify(post.slug || post.title || `post-${Date.now()}`),
  excerpt: post.excerpt || "A fresh insight from the EkSaha team.",
  content: post.content || post.excerpt || "This post is ready for content.",
  category: post.category || "Insights",
  status: post.status || "Draft",
  updated: post.updated || today(),
  read: post.read || "4 min",
  ...post,
});

const emptyAdminState = {
  users: [],
  services: [],
  posts: [],
  invoices: [],
  notifications: [],
  settings: { company: "EkSaha", email: "", currency: "USD", role: "" },
};

export const useAdminStore = create(
  persist(
    (set) => ({
      ...emptyAdminState,
      addUser: (user) => set((state) => ({ users: [{ id: Date.now(), ...user }, ...state.users] })),
      updateUser: (id, changes) => set((state) => ({ users: state.users.map((user) => user.id === id ? { ...user, ...changes } : user) })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter((user) => user.id !== id) })),
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
    {
      name: "eksaha-admin-dashboard",
      version: 2,
      migrate: () => emptyAdminState,
    },
  ),
);
