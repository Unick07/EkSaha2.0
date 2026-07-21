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
    <div className="animate-modal-backdrop fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section
        aria-modal="true"
        role="dialog"
        className={`animate-modal-panel max-h-[90vh] w-full overflow-auto rounded-3xl border border-border bg-surface text-text shadow-2xl ${widths[size]}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface p-6">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button aria-label="Close dialog" className="icon-button size-9 rounded-xl" onClick={onClose}>
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
        <button className="soft-button" onClick={onClose}>Cancel</button>
        <button className={danger ? "danger-button" : "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
