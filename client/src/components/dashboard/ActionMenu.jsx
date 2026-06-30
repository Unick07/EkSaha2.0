import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export default function ActionMenu({ actions, label = "Open actions" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button aria-label={label} className="icon-button size-9 rounded-xl" onClick={() => setOpen(!open)}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-40 min-w-44 rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
          {actions.map(({ label: actionLabel, icon: Icon, onClick, danger, disabled }) => (
            <button
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition disabled:opacity-40 ${danger ? "text-red-600 hover:bg-red-500/10 dark:text-red-300" : "text-text hover:bg-surface-raised"}`}
              disabled={disabled}
              key={actionLabel}
              onClick={() => { setOpen(false); onClick(); }}
            >
              {Icon && <Icon size={15} />}
              {actionLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
