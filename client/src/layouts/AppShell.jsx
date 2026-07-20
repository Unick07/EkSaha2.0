import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { Bell, BookOpen, ChartNoAxesCombined, CheckCheck, CreditCard, FileText, Headphones, LayoutDashboard, LogOut, Menu, Moon, Package, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, Sun, Users, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useAdminStore } from "../store/useAdminStore";
import { useUserDashboardStore } from "../store/useUserDashboardStore";
import { useAuth } from "../hooks/useAuth";
import { Modal } from "../components/dashboard/Modal";
import { homeForRole } from "../lib/roles";
import api from "../services/http/api";
import { useEffect, useState } from "react";

const userLinks = [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true }, { to: "/dashboard/services", label: "My services", icon: Package }, { to: "/dashboard/tickets", label: "Support tickets", icon: Headphones }, { to: "/dashboard/invoices", label: "Invoices", icon: FileText }, { to: "/dashboard/settings", label: "Account settings", icon: Settings }];
const adminLinks = [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }, { to: "/admin/users", label: "Users", icon: Users }, { to: "/admin/team", label: "Team", icon: ShieldCheck }, { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard }, { to: "/admin/services", label: "Services", icon: Package }, { to: "/admin/tickets", label: "Tickets", icon: Headphones }, { to: "/admin/blog", label: "Blog", icon: BookOpen }, { to: "/admin/invoices", label: "Invoices", icon: FileText }, { to: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined }, { to: "/admin/settings", label: "Settings", icon: Settings }];
const supportLinks = [{ to: "/support/users", label: "Users", icon: Users, end: true }, { to: "/support/services", label: "Services", icon: Package }, { to: "/support/tickets", label: "Tickets", icon: Headphones }, { to: "/support/blog", label: "Blog", icon: BookOpen }, { to: "/support/settings", label: "Account settings", icon: Settings }];
const billingLinks = [{ to: "/billing/subscriptions", label: "Subscriptions", icon: CreditCard, end: true }, { to: "/billing/services", label: "Services", icon: Package }, { to: "/billing/invoices", label: "Invoices", icon: FileText }, { to: "/billing/tickets", label: "Billing tickets", icon: Headphones }, { to: "/billing/users", label: "Users (View only)", icon: Users }, { to: "/billing/settings", label: "Account settings", icon: Settings }];

const linksByVariant = { user: userLinks, admin: adminLinks, support: supportLinks, billing: billingLinks };
const workspaceLabel = { admin: "ADMIN WORKSPACE", support: "SUPPORT WORKSPACE", billing: "BILLING WORKSPACE" };
const subtitleByVariant = {
  admin: "Manage your EkSaha operation",
  support: "Support workspace — tickets, customers and insights",
  billing: "Billing workspace — subscriptions, invoices and customers",
};

export default function AppShell({ variant = "user" }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggleDark, sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useAppStore();
  const userNotifications = useUserDashboardStore((state) => state.notifications);
  const markUserNotificationsRead = useUserDashboardStore((state) => state.markNotificationsRead);
  const adminNotifications = useAdminStore((state) => state.notifications);
  const markAdminNotificationsRead = useAdminStore((state) => state.markAdminNotificationsRead);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const load = () => api.get("/notifications/unread-count")
      .then(({ data }) => { if (active) setUnreadMessages(data?.count || 0); })
      .catch(() => {});
    load();
    const interval = window.setInterval(load, 20000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== variant) return <Navigate to={homeForRole(user.role)} replace />;
  const isStaff = variant !== "user";
  const links = linksByVariant[variant];
  const title = links.find(link => link.end ? location.pathname === link.to : location.pathname.startsWith(link.to))?.label || "Dashboard";
  const collapsed = sidebarCollapsed && !sidebarOpen;
  const notifications = isStaff ? adminNotifications : userNotifications;
  const markNotificationsRead = isStaff ? markAdminNotificationsRead : markUserNotificationsRead;
  const unread = unreadMessages;
  return <div className="min-h-screen bg-background text-text">
    {sidebarOpen && <button aria-label="Close sidebar overlay" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex transform flex-col border-r border-border bg-surface p-4 text-text shadow-2xl transition-all duration-300 lg:translate-x-0 ${collapsed ? "lg:w-20" : "w-72"} ${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full"}`}>
      <div className={`flex flex-shrink-0 items-center ${collapsed ? "justify-center" : "justify-between"}`}><Link to="/" className="flex items-center gap-2.5 font-extrabold"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">E</span>{!collapsed && <span>EkSaha</span>}</Link><button className="icon-button lg:hidden" onClick={() => setSidebarOpen(false)}><X/></button></div>
      {isStaff && !collapsed && <div className="mt-7 flex-shrink-0 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary">{workspaceLabel[variant]}</div>}
      <nav className="mt-7 flex-1 space-y-1 overflow-y-auto">{links.map(({ to, label, icon: Icon, end }) => <NavLink title={collapsed ? label : undefined} onClick={() => setSidebarOpen(false)} to={to} end={end} key={to} className={({ isActive }) => `flex items-center rounded-xl py-3 text-sm font-semibold transition ${collapsed ? "justify-center px-2" : "gap-3 px-4"} ${isActive ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "text-muted hover:bg-surface-raised hover:text-text"}`}><Icon size={18}/>{!collapsed && label}</NavLink>)}</nav>
      <div className="flex-shrink-0 border-t border-border pt-4">{!collapsed && <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3"><span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">{user.name[0]}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{user.name}</div><div className="truncate text-xs text-muted">{user.email}</div></div></div>}<button title={collapsed ? "Sign out" : undefined} onClick={logout} className={`flex w-full items-center rounded-xl py-3 text-sm font-semibold text-muted transition hover:bg-surface-raised hover:text-text ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}><LogOut size={17}/>{!collapsed && "Sign out"}</button></div>
    </aside>
    <div className={`transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-surface/85 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><button className="icon-button lg:hidden" onClick={() => setSidebarOpen(true)}><Menu/></button><button title={collapsed ? "Show side panel" : "Hide side panel"} className="icon-button hidden lg:grid" onClick={toggleSidebarCollapsed}>{collapsed ? <PanelLeftOpen size={19}/> : <PanelLeftClose size={19}/>}</button><div><h1 className="text-lg font-bold">{title}</h1><p className="hidden text-xs text-muted sm:block">{isStaff ? subtitleByVariant[variant] : "Welcome back, " + user.name.split(" ")[0]}</p></div></div><div className="flex items-center gap-2"><button title="Toggle theme" onClick={toggleDark} className="icon-button">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button title="Notifications" onClick={() => setNotificationsOpen(true)} className="icon-button relative"><Bell size={18} className={unread > 0 ? "animate-pulse" : ""}/>{unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 animate-pulse place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{unread}</span>}</button></div></header><main className="p-5 sm:p-8"><Outlet/></main></div>
    <Modal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notifications" description="Recent account and service activity.">
      <div className="space-y-3">{notifications.map((item) => <div className={`rounded-2xl border p-4 ${item.read ? "border-border" : "border-primary/30 bg-primary/10"}`} key={item.id}><div className="font-semibold">{item.title}</div><div className="mt-1 text-xs text-muted">{item.time}</div></div>)}</div>
      <button className="text-action mt-5" onClick={markNotificationsRead}><CheckCheck size={16}/>Mark all as read</button>
    </Modal>
  </div>;
}
