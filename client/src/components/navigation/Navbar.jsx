import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { services } from "../../data/siteData";
import { Button } from "../common/ui";

const links = [{ label: "Pricing", to: "/pricing" }, { label: "About", to: "/about" }, { label: "Insights", to: "/insights" }];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { dark, toggleDark, user } = useAppStore();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-ink/85">
    <nav className="container-shell flex h-20 items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-glow">N</span>
        <span>Nextexa <span className="text-electric">Lab</span></span>
      </Link>
      <div className="hidden items-center gap-7 lg:flex">
        <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
          <button className="flex items-center gap-1 py-7 text-sm font-semibold text-slate-600 dark:text-slate-300">Services <ChevronDown size={14} /></button>
          {servicesOpen && <div className="absolute left-1/2 top-[68px] w-[520px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#111735]">
            <div className="grid grid-cols-2">{services.map(({ slug, icon: Icon, title, short }) => <Link key={slug} to={`/services/${slug}`} className="flex gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-white/5"><Icon className="mt-0.5 text-electric" size={19} /><div><div className="text-sm font-bold">{title}</div><div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{short}</div></div></Link>)}</div>
          </div>}
        </div>
        {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => `text-sm font-semibold transition hover:text-electric ${isActive ? "text-electric" : "text-slate-600 dark:text-slate-300"}`}>{link.label}</NavLink>)}
      </div>
      <div className="hidden items-center gap-2 lg:flex">
        <button onClick={toggleDark} className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        <Button to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} variant="ghost">{user ? "Dashboard" : "Sign in"}</Button>
        <Button to="/signup">Get started</Button>
      </div>
      <button className="grid size-10 place-items-center lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
    </nav>
    {open && <div className="container-shell border-t border-slate-100 py-4 lg:hidden dark:border-white/10">
      <div className="space-y-1">
        {services.map((service) => <Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold" key={service.slug} to={`/services/${service.slug}`}>{service.title}</Link>)}
        {links.map((link) => <Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold" key={link.to} to={link.to}>{link.label}</Link>)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2"><Button to="/login" variant="secondary">Sign in</Button><Button to="/signup">Get started</Button></div>
    </div>}
  </header>;
}
