import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { Bell, BookOpen, ChartNoAxesCombined, CheckCheck, CreditCard, FileText, Headphones, LayoutDashboard, LogOut, Menu, Moon, Package, PanelLeftClose, PanelLeftOpen, Settings, Sun, Users, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useAdminStore } from "../store/useAdminStore";
import { useUserDashboardStore } from "../store/useUserDashboardStore";
import { useAuth } from "../hooks/useAuth";
import { Modal } from "../components/dashboard/Modal";
import { useEffect, useState } from "react";

const userLinks = [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true }, { to: "/dashboard/services", label: "My services", icon: Package }, { to: "/dashboard/tickets", label: "Support tickets", icon: Headphones }, { to: "/dashboard/invoices", label: "Invoices", icon: FileText }, { to: "/dashboard/settings", label: "Account settings", icon: Settings }];
const adminLinks = [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }, { to: "/admin/users", label: "Users", icon: Users }, { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard }, { to: "/admin/services", label: "Services", icon: Package }, { to: "/admin/tickets", label: "Tickets", icon: Headphones }, { to: "/admin/blog", label: "Blog", icon: BookOpen }, { to: "/admin/invoices", label: "Invoices", icon: FileText }, { to: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined }, { to: "/admin/settings", label: "Settings", icon: Settings }];

export default function AppShell({ admin = false }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { dark, toggleDark, sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useAppStore();
  const userNotifications = useUserDashboardStore((state) => state.notifications);
  const markUserNotificationsRead = useUserDashboardStore((state) => state.markNotificationsRead);
  const adminNotifications = useAdminStore((state) => state.notifications);
  const ingestTickets = useAdminStore((state) => state.ingestTickets);
  const markAdminNotificationsRead = useAdminStore((state) => state.markAdminNotificationsRead);
  const location = useLocation();
  useEffect(() => {
    if (!admin || !isAdmin) return undefined;
    const syncTickets = () => {
      fetch("/api/demo/tickets")
        .then((response) => response.json())
        .then(ingestTickets)
        .catch(() => {});
    };
    syncTickets();
    const interval = window.setInterval(syncTickets, 10000);
    return () => window.clearInterval(interval);
  }, [admin, isAdmin, ingestTickets]);
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  const links = admin ? adminLinks : userLinks;
  const title = links.find(link => link.end ? location.pathname === link.to : location.pathname.startsWith(link.to))?.label || "Dashboard";
  const collapsed = sidebarCollapsed && !sidebarOpen;
  const notifications = admin ? adminNotifications : userNotifications;
  const markNotificationsRead = admin ? markAdminNotificationsRead : markUserNotificationsRead;
  const unread = notifications.filter((item) => !item.read).length;
  return <div className="min-h-screen bg-background text-text">
    {sidebarOpen && <button aria-label="Close sidebar overlay" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 transform border-r border-border bg-surface p-4 text-text shadow-2xl transition-all duration-300 lg:translate-x-0 ${collapsed ? "lg:w-20" : "w-72"} ${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full"}`}>
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}><Link to="/" className="flex items-center gap-2.5 font-extrabold"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">E</span>{!collapsed && <span>EkSaha</span>}</Link><button className="icon-button lg:hidden" onClick={() => setSidebarOpen(false)}><X/></button></div>
      {admin && !collapsed && <div className="mt-7 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary">Admin workspace</div>}
      <nav className="mt-7 space-y-1">{links.map(({ to, label, icon: Icon, end }) => <NavLink title={collapsed ? label : undefined} onClick={() => setSidebarOpen(false)} to={to} end={end} key={to} className={({ isActive }) => `flex items-center rounded-xl py-3 text-sm font-semibold transition ${collapsed ? "justify-center px-2" : "gap-3 px-4"} ${isActive ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "text-muted hover:bg-surface-raised hover:text-text"}`}><Icon size={18}/>{!collapsed && label}</NavLink>)}</nav>
      <div className="absolute bottom-4 left-4 right-4">{!collapsed && <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3"><span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">{user.name[0]}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{user.name}</div><div className="truncate text-xs text-muted">{user.email}</div></div></div>}<button title={collapsed ? "Sign out" : undefined} onClick={logout} className={`flex w-full items-center rounded-xl py-3 text-sm font-semibold text-muted transition hover:bg-surface-raised hover:text-text ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}><LogOut size={17}/>{!collapsed && "Sign out"}</button></div>
    </aside>
    <div className={`transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-surface/85 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><button className="icon-button lg:hidden" onClick={() => setSidebarOpen(true)}><Menu/></button><button title={collapsed ? "Show side panel" : "Hide side panel"} className="icon-button hidden lg:grid" onClick={toggleSidebarCollapsed}>{collapsed ? <PanelLeftOpen size={19}/> : <PanelLeftClose size={19}/>}</button><div><h1 className="text-lg font-bold">{title}</h1><p className="hidden text-xs text-muted sm:block">{admin ? "Manage your EkSaha operation" : "Welcome back, " + user.name.split(" ")[0]}</p></div></div><div className="flex items-center gap-2"><button title="Toggle theme" onClick={toggleDark} className="icon-button">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button title="Notifications" onClick={() => setNotificationsOpen(true)} className="icon-button relative"><Bell size={18}/>{unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{unread}</span>}</button></div></header><main className="p-5 sm:p-8"><Outlet/></main></div>
    <Modal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notifications" description="Recent account and service activity.">
      <div className="space-y-3">{notifications.map((item) => <div className={`rounded-2xl border p-4 ${item.read ? "border-border" : "border-primary/30 bg-primary/10"}`} key={item.id}><div className="font-semibold">{item.title}</div><div className="mt-1 text-xs text-muted">{item.time}</div></div>)}</div>
      <button className="text-action mt-5" onClick={markNotificationsRead}><CheckCheck size={16}/>Mark all as read</button>
    </Modal>
  </div>;
}
