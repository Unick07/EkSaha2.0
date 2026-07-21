import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 420);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return <button
    type="button"
    aria-label="Scroll to top"
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    className={`fixed bottom-5 right-5 z-[90] grid size-12 place-items-center rounded-2xl border border-border bg-surface/90 text-primary shadow-2xl shadow-slate-950/15 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 dark:shadow-black/30 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
  >
    <ArrowUp size={20} />
  </button>;
}
