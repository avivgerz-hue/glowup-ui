import { useEffect, useId, useRef } from "react";
import { cn } from "./cn.js";
import { Icon } from "./Icon.jsx";

// Native modal isolation and focus return, with explicit Tab wrapping at the boundaries.
// <Dialog open={open} onClose={() => setOpen(false)} title="Invite teammate">...</Dialog>
export function Dialog({ open, onClose, title, description, children, className }) {
  const ref = useRef(null);
  const titleId = useId();
  const close = () => {
    const el = ref.current;
    if (!el?.open) return;
    if (el.close) el.close();
    else { el.removeAttribute("open"); onClose?.(); }
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) (el.showModal ? el.showModal() : el.setAttribute("open", ""));
    if (!open && el.open) (el.close ? el.close() : el.removeAttribute("open"));
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      tabIndex={-1}
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClick={(e) => { if (e.target === ref.current) close(); }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const el = ref.current;
        const items = [...el.querySelectorAll("button, input, select, textarea, a[href], [tabindex], [contenteditable='true']")]
          .filter((node) => node.tabIndex >= 0 && !node.matches(":disabled") && node.getClientRects().length && getComputedStyle(node).visibility !== "hidden");
        if (!items.length) { e.preventDefault(); el.focus(); return; }
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === el)) { e.preventDefault(); first.focus(); }
      }}
      className={cn(
        "m-auto w-[min(32rem,calc(100vw-2rem))] rounded-sheet border border-line bg-raised p-0 text-ink shadow-pop backdrop:bg-black/40 backdrop:backdrop-blur-[2px]",
        "max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none", className,
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={close} aria-label="Close" className="grid size-11 shrink-0 place-content-center rounded-control text-muted hover:bg-sunken hover:text-ink">
            <Icon name="x" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
