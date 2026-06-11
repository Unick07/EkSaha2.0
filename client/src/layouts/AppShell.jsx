import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { Bell, BookOpen, ChartNoAxesCombined, CreditCard, FileText, Headphones, LayoutDashboard, LogOut, Menu, Moon, Package, Settings, Sun, Users, X } from "lucide-react";
import { useAppStore } from "../features/useAppStore";
import { useAuth } from "../hooks/useAuth";

const userLinks = [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true }, { to: "/dashboard/services", label: "My services", icon: Package }, { to: "/dashboard/tickets", label: "Support tickets", icon: Headphones }, { to: "/dashboard/invoices", label: "Invoices", icon: FileText }, { to: "/dashboard/settings", label: "Account settings", icon: Settings }];
const adminLinks = [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }, { to: "/admin/users", label: "Users", icon: Users }, { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard }, { to: "/admin/services", label: "Services", icon: Package }, { to: "/admin/tickets", label: "Tickets", icon: Headphones }, { to: "/admin/blog", label: "Blog", icon: BookOpen }, { to: "/admin/invoices", label: "Invoices", icon: FileText }, { to: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined }, { to: "/admin/settings", label: "Settings", icon: Settings }];

export default function AppShell({ admin = false }) {
  const { user, isAdmin, logout } = useAuth(); const { dark, toggleDark, sidebarOpen, setSidebarOpen } = useAppStore(); const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  const links = admin ? adminLinks : userLinks;
  const title = links.find(link => link.end ? location.pathname === link.to : location.pathname.startsWith(link.to))?.label || "Dashboard";
  return <div className="min-h-screen bg-slate-50 dark:bg-[#070b22]">
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-ink p-5 text-white transition lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between"><Link to="/" className="flex items-center gap-2.5 font-extrabold"><span className="grid size-9 place-items-center rounded-xl bg-electric">N</span>Nextexa Lab</Link><button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X/></button></div>
      {admin && <div className="mt-7 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-blue-300">Admin workspace</div>}
      <nav className="mt-7 space-y-1">{links.map(({ to, label, icon: Icon, end }) => <NavLink onClick={() => setSidebarOpen(false)} to={to} end={end} key={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-electric text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon size={18}/>{label}</NavLink>)}</nav>
      <div className="absolute bottom-5 left-5 right-5"><div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-3"><span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 text-sm font-bold text-ink">{user.name[0]}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{user.name}</div><div className="truncate text-xs text-slate-500">{user.email}</div></div></div><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"><LogOut size={17}/>Sign out</button></div>
    </aside>
    <div className="lg:pl-72"><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/85 px-5 backdrop-blur dark:border-white/10 dark:bg-ink/85 sm:px-8"><div className="flex items-center gap-4"><button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu/></button><div><h1 className="text-lg font-bold">{title}</h1><p className="hidden text-xs text-slate-500 sm:block">{admin ? "Manage your Nextexa operation" : "Welcome back, " + user.name.split(" ")[0]}</p></div></div><div className="flex items-center gap-2"><button onClick={toggleDark} className="grid size-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="relative grid size-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"><Bell size={18}/><span className="absolute right-2 top-2 size-2 rounded-full bg-electric"/></button></div></header><main className="p-5 sm:p-8"><Outlet/></main></div>
  </div>;
}
