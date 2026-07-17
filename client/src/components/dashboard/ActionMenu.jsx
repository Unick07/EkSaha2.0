import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

const MENU_WIDTH = 176;
const VIEWPORT_MARGIN = 8;

export default function ActionMenu({ actions, label = "Open actions" }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const estimatedHeight = menuRef.current?.offsetHeight || actions.length * 40 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < estimatedHeight + VIEWPORT_MARGIN && spaceAbove > spaceBelow;
    const top = openUpward
      ? Math.max(VIEWPORT_MARGIN, rect.top - estimatedHeight - VIEWPORT_MARGIN)
      : rect.bottom + VIEWPORT_MARGIN;
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN,
    );
    setPosition({ top, left });
    // Re-run once the menu has mounted so we can measure its real height and refine the flip decision.
  }, [open, actions.length]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (buttonRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const closeOnScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("scroll", closeOnScrollOrResize, true);
    window.addEventListener("resize", closeOnScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("scroll", closeOnScrollOrResize, true);
      window.removeEventListener("resize", closeOnScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        aria-label={label}
        className="icon-button size-9 rounded-xl"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: position.top, left: position.left, width: MENU_WIDTH }}
          className="z-[100] rounded-2xl border border-border bg-surface p-1.5 shadow-xl"
        >
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
        </div>,
        document.body,
      )}
    </>
  );
}
