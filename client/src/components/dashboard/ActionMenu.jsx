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
      <button aria-label={label} className="grid size-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => setOpen(!open)}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-40 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#111735]">
          {actions.map(({ label: actionLabel, icon: Icon, onClick, danger, disabled }) => (
            <button
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold disabled:opacity-40 ${danger ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
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
