import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLocation } from "react-router-dom";

const SHOW_AFTER = 80;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > SHOW_AFTER);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [pathname]);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return <button
    type="button"
    onClick={scrollToTop}
    aria-label="Back to top"
    title="Back to top"
    aria-hidden={!visible}
    tabIndex={visible ? 0 : -1}
    className={`fixed bottom-5 right-5 z-[70] grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition duration-300 hover:-translate-y-1 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:bottom-8 sm:right-8 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
  >
    <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
  </button>;
}
