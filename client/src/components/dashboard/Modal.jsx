import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, description, children, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section
        aria-modal="true"
        role="dialog"
        className={`max-h-[90vh] w-full overflow-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111735] ${widths[size]}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-6 dark:border-white/10 dark:bg-[#111735]">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button aria-label="Close dialog" className="grid size-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex justify-end gap-3">
        <button className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold dark:border-white/10" onClick={onClose}>Cancel</button>
        <button className={`rounded-xl px-5 py-3 text-sm font-bold text-white ${danger ? "bg-red-600" : "bg-electric"}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
