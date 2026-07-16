import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { services } from "../../data/siteData";
import { Button } from "../common/ui";
import { homeForRole } from "../../lib/roles";

const links = [
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Insights", to: "/insights" },
];

const navLinkClass = ({ isActive }) => [
  "rounded-full px-4 py-2 text-sm font-bold transition",
  isActive
    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
    : "text-muted hover:bg-surface-raised hover:text-text",
].join(" ");

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { dark, toggleDark, user } = useAppStore();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const dashboardPath = user ? homeForRole(user.role) : "/login";

  return <header className={`${isLanding ? "fixed inset-x-0 top-0" : "sticky top-0"} z-50 px-3 py-3 sm:px-5`}>
    <div className="container-shell">
      <nav className="relative flex h-16 items-center justify-between rounded-3xl border border-border/70 bg-surface/85 px-3 shadow-xl shadow-slate-950/5 backdrop-blur-2xl dark:shadow-black/20 lg:px-4">
        <Link to="/" className="group flex items-center gap-3 rounded-2xl pr-3 font-extrabold tracking-tight" onClick={() => setOpen(false)}>
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow transition group-hover:scale-105">E</span>
          <span className="text-lg text-text">Ek<span className="text-primary">Saha</span></span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-border/70 bg-background/70 p-1 shadow-inner lg:flex">
          <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
            <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-muted transition hover:bg-surface hover:text-text">
              Services <ChevronDown className={`transition ${servicesOpen ? "rotate-180" : ""}`} size={14} />
            </button>
            {servicesOpen && <div className="absolute left-1/2 top-12 w-[640px] -translate-x-1/2 pt-4">
              <div className="overflow-hidden rounded-[2rem] border border-border bg-surface p-3 shadow-2xl shadow-slate-950/15 dark:shadow-black/40">
                <div className="grid grid-cols-[.8fr_1.2fr] gap-3">
                  <div className="rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 p-5">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sparkles size={19} /></div>
                    <h3 className="mt-5 text-lg font-extrabold text-text">One subscription. A full digital team.</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">Choose exactly the support you need across growth, web, ads, and IT.</p>
                    <Link to="/pricing" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Compare plans <ArrowRight size={14} /></Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {services.map(({ slug, icon: Icon, title, short }) => <Link key={slug} to={`/services/${slug}`} className="group flex gap-3 rounded-2xl p-3 transition hover:bg-surface-raised">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><Icon size={18} /></span>
                      <span>
                        <span className="block text-sm font-extrabold text-text">{title}</span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">{short}</span>
                      </span>
                    </Link>)}
                  </div>
                </div>
              </div>
            </div>}
          </div>
          {links.map((link) => <NavLink key={link.to} to={link.to} className={navLinkClass}>{link.label}</NavLink>)}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button onClick={toggleDark} className="grid size-10 place-items-center rounded-2xl border border-border text-muted transition hover:bg-surface-raised hover:text-text" aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Button to={dashboardPath} variant="ghost">{user ? "Dashboard" : "Sign in"}</Button>
          <Button to="/signup">Get started</Button>
        </div>

        <button className="grid size-11 place-items-center rounded-2xl border border-border text-text transition hover:bg-surface-raised lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
    </div>

    {open && <div className="container-shell lg:hidden">
      <div className="mt-3 overflow-hidden rounded-[2rem] border border-border bg-surface p-3 shadow-2xl shadow-slate-950/10 dark:shadow-black/30">
        <div className="rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 p-4">
          <div className="text-xs font-bold uppercase tracking-[.18em] text-primary">Explore services</div>
          <div className="mt-3 grid gap-2">
            {services.map(({ slug, icon: Icon, title }) => <Link onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl bg-surface/70 p-3 text-sm font-bold text-text" key={slug} to={`/services/${slug}`}>
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={17} /></span>{title}
            </Link>)}
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {links.map((link) => <Link onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-muted hover:bg-surface-raised hover:text-text" key={link.to} to={link.to}>{link.label}</Link>)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button to={dashboardPath} variant="secondary" onClick={() => setOpen(false)}>{user ? "Dashboard" : "Sign in"}</Button>
          <Button to="/signup" onClick={() => setOpen(false)}>Get started</Button>
        </div>
        <button onClick={toggleDark} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-bold text-muted">
          {dark ? <Sun size={17} /> : <Moon size={17} />} {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </div>}
  </header>;
}
