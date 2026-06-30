import { useAppStore } from "../store/useAppStore";

export function useAuth() {
  const { user, login, logout } = useAppStore();
  return { user, login, logout, isAuthenticated: Boolean(user), isAdmin: user?.role === "admin" };
}
