import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export default function useHeaderAction({ label, icon: Icon, onClick, enabled = true }) {
  const { setHeaderAction } = useOutletContext() || {};

  useEffect(() => {
    if (!enabled || !setHeaderAction) return undefined;
    setHeaderAction(
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className="inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
      >
        <Icon size={16}/>
        <span className="hidden sm:inline">{label}</span>
      </button>,
    );
    return () => setHeaderAction(null);
  }, [Icon, enabled, label, onClick, setHeaderAction]);
}
