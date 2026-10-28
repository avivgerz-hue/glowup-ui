import { cn } from "./cn.js";
import { Icon } from "./Icon.jsx";

// Custom-drawn checkbox, radio, and switch over a real (visually hidden) input, so keyboard
// and screen-reader behavior stay native. <Checkbox label="Email me" checked onChange />
const box =
  "grid shrink-0 place-content-center border border-line-strong bg-surface text-on-primary transition-colors " +
  "peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:opacity-50";

export function Checkbox({ label, hint, className, ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className={cn(box, "mt-0.5 size-5 rounded-[min(var(--radius-control),6px)] peer-checked:[&_svg]:opacity-100")}>
        <Icon name="check" size={14} strokeWidth={3} className="opacity-0 transition-opacity" />
      </span>
      <span className="text-[15px] text-ink">{label}{hint && <span className="block text-sm text-muted">{hint}</span>}</span>
    </label>
  );
}

export function Radio({ label, hint, className, ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input type="radio" className="peer sr-only" {...props} />
      <span className={cn(box, "mt-0.5 size-5 rounded-full peer-checked:[&>i]:scale-100")}>
        <i className="size-2 scale-0 rounded-full bg-on-primary transition-transform" />
      </span>
      <span className="text-[15px] text-ink">{label}{hint && <span className="block text-sm text-muted">{hint}</span>}</span>
    </label>
  );
}

export function Switch({ label, className, ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3", className)}>
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span className="relative h-6 w-10 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:opacity-50 peer-checked:[&>i]:translate-x-4">
        <i className="absolute left-0.5 top-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform" />
      </span>
      <span className="text-[15px] text-ink">{label}</span>
    </label>
  );
}
