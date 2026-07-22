import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronRight, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { services } from "../../data/siteData";
import { Button } from "../common/ui";
import { BrandLogo } from "../common/BrandLogo";
import { homeForRole } from "../../lib/roles";

const links = [
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Insights", to: "/insights" },
];

const navLinkClass = ({ isActive }) => [
  "rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
  isActive
    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
    : "text-muted hover:bg-surface-raised hover:text-text",
].join(" ");

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const headerRef = useRef(null);
  const servicesMenuRef = useRef(null);
  const servicesButtonRef = useRef(null);
  const closeTimerRef = useRef(null);
  const { theme, toggleTheme, user } = useAppStore();
  const dark = theme === "dark";
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const servicesActive = location.pathname.startsWith("/services");
  const dashboardPath = user ? homeForRole(user.role) : "/login";

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  const openServicesMenu = () => {
    cancelScheduledClose();
    setServicesOpen(true);
  };

  const scheduleServicesClose = () => {
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(() => setServicesOpen(false), 180);
  };

  const closeAllMenus = useCallback(() => {
    cancelScheduledClose();
    setOpen(false);
    setServicesOpen(false);
    setMobileServicesOpen(false);
  }, [cancelScheduledClose]);

  useEffect(() => {
    closeAllMenus();
  }, [closeAllMenus, location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) closeAllMenus();
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      const shouldRestoreFocus = servicesOpen;
      closeAllMenus();
      if (shouldRestoreFocus) servicesButtonRef.current?.focus();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelScheduledClose();
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [cancelScheduledClose, closeAllMenus, servicesOpen]);

  return <header ref={headerRef} className={`${isLanding ? "fixed inset-x-0 top-0" : "sticky top-0"} z-50 px-3 py-3 sm:px-5`}>
    <div className="container-shell">
      <nav className="relative flex h-16 items-center justify-between rounded-3xl border border-border/70 bg-surface/90 px-3 shadow-xl shadow-brand-navy/5 backdrop-blur-2xl dark:shadow-black/20 lg:px-4" aria-label="Main navigation">
        <Link to="/" aria-label="EkSaha home" className="group inline-flex rounded-xl px-1 py-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20" onClick={closeAllMenus}>
          <BrandLogo alt="" size="sm" imageClassName="transition-transform duration-200 group-hover:scale-[1.02] sm:h-8" />
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-border/70 bg-background/70 p-1 shadow-inner lg:flex">
          <div
            ref={servicesMenuRef}
            className="relative"
            onMouseEnter={openServicesMenu}
            onMouseLeave={scheduleServicesClose}
            onBlur={(event) => {
              if (!servicesMenuRef.current?.contains(event.relatedTarget)) scheduleServicesClose();
            }}
          >
            <button
              ref={servicesButtonRef}
              type="button"
              aria-haspopup="true"
              aria-expanded={servicesOpen}
              aria-controls="desktop-services-menu"
              onClick={openServicesMenu}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${servicesActive || servicesOpen ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "text-muted hover:bg-surface hover:text-text"}`}
            >
              Services <ChevronDown className={`transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} size={14} />
            </button>

            <div className={`absolute left-1/2 top-full w-[720px] -translate-x-1/2 pt-3 transition duration-150 ${servicesOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
              <div id="desktop-services-menu" className="overflow-hidden rounded-[2rem] border border-border bg-surface p-3 shadow-2xl shadow-brand-navy/15 dark:shadow-black/40">
                <div className="grid grid-cols-[.72fr_1.28fr] gap-3">
                  <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white">
                    <div className="grid-mask absolute inset-0 opacity-40" aria-hidden="true" />
                    <div className="relative">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-on-brand-accent text-ink"><Sparkles size={19} /></div>
                      <div className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-on-brand-accent">Flexible support</div>
                      <h2 className="mt-2 text-xl font-extrabold tracking-tight">One subscription. A complete digital team.</h2>
                      <p className="mt-3 text-sm leading-6 text-on-brand-muted">Combine the specialists you need, then change direction as your priorities evolve.</p>
                      <Link onClick={closeAllMenus} to="/pricing" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-on-brand-accent px-4 py-2.5 text-sm font-extrabold text-ink transition hover:bg-on-brand-accent/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-on-brand-accent/30">Explore pricing <ArrowRight size={14} /></Link>
                    </div>
                  </div>

                  <div className="p-2">
                    <div className="flex items-end justify-between gap-4 px-2 pb-3">
                      <div><div className="text-xs font-extrabold uppercase tracking-[.16em] text-primary">Our services</div><p className="mt-1 text-xs text-muted">Explore a capability in detail</p></div>
                      <Link onClick={closeAllMenus} to="/contact" className="text-xs font-bold text-primary hover:text-accent">Get a recommendation</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {services.map(({ slug, icon: Icon, title, short }) => <Link
                        key={slug}
                        to={`/services/${slug}`}
                        onClick={closeAllMenus}
                        className="group flex min-h-28 gap-3 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-surface-raised focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><Icon size={18} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2 text-sm font-extrabold text-text">{title}<ChevronRight size={14} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" /></span>
                          <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-muted">{short}</span>
                        </span>
                      </Link>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {links.map((link) => <NavLink key={link.to} to={link.to} className={navLinkClass}>{link.label}</NavLink>)}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button onClick={toggleTheme} className="grid size-10 place-items-center rounded-2xl border border-border text-muted transition hover:bg-surface-raised hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Button to={dashboardPath} variant="ghost">{user ? "Dashboard" : "Sign in"}</Button>
          <Button to="/signup">Get started</Button>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-2xl border border-border text-text transition hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 lg:hidden"
          onClick={() => {
            setOpen((current) => !current);
            setMobileServicesOpen(false);
          }}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation-menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
    </div>

    <div className={`container-shell transition duration-200 lg:hidden ${open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-2 opacity-0"}`}>
      <div id="mobile-navigation-menu" className="mt-3 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[2rem] border border-border bg-surface p-3 shadow-2xl shadow-brand-navy/10 dark:shadow-black/30">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised/55">
          <button
            type="button"
            onClick={() => setMobileServicesOpen((current) => !current)}
            aria-expanded={mobileServicesOpen}
            aria-controls="mobile-services-list"
            className="flex w-full items-center justify-between gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/20"
          >
            <span><span className="block text-sm font-extrabold text-text">Services</span><span className="mt-1 block text-xs text-muted">Growth, web, ads, and IT support</span></span>
            <span className={`grid size-8 shrink-0 place-items-center rounded-xl transition ${mobileServicesOpen ? "bg-primary text-primary-foreground" : "bg-surface text-muted"}`}><ChevronDown size={16} className={`transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} /></span>
          </button>

          <div id="mobile-services-list" hidden={!mobileServicesOpen} className={mobileServicesOpen ? "grid grid-rows-[1fr]" : "hidden"}>
            <div className="overflow-hidden">
              <div className="grid gap-1 border-t border-border p-2">
                {services.map(({ slug, icon: Icon, title }) => <Link
                  onClick={closeAllMenus}
                  className={`flex items-center gap-3 rounded-xl p-3 text-sm font-bold transition ${location.pathname === `/services/${slug}` ? "bg-primary text-primary-foreground" : "text-text hover:bg-surface"}`}
                  key={slug}
                  to={`/services/${slug}`}
                >
                  <span className={`grid size-9 place-items-center rounded-xl ${location.pathname === `/services/${slug}` ? "bg-primary-foreground/15" : "bg-primary/10 text-primary"}`}><Icon size={17} /></span>
                  <span className="flex-1">{title}</span><ChevronRight size={15} className="opacity-60" />
                </Link>)}
                <Link onClick={closeAllMenus} to="/pricing" className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-extrabold text-white">Compare all plans <ArrowRight size={15} /></Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 grid gap-1">
          {links.map((link) => <Link onClick={closeAllMenus} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${location.pathname === link.to ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-raised hover:text-text"}`} key={link.to} to={link.to}>{link.label}<ChevronRight size={15} /></Link>)}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
          <Button to={dashboardPath} variant="secondary" onClick={closeAllMenus}>{user ? "Dashboard" : "Sign in"}</Button>
          <Button to="/signup" onClick={closeAllMenus}>Get started</Button>
        </div>
        <button onClick={toggleTheme} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-bold text-muted transition hover:bg-surface-raised hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
          {dark ? <Sun size={17} /> : <Moon size={17} />} {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </div>
  </header>;
}
