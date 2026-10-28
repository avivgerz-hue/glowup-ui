import { useId } from "react";
import { cn } from "./cn.js";
import { Icon } from "./Icon.jsx";

// Label, control, hint, and error wired together for screen readers.
// <Input label="Email" error={errors.email} />   <Input label="Search" labelHidden icon="search" />
function FieldShell({ id, label, labelHidden, hint, error, className, children }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={id} className={cn("text-sm font-medium text-ink", labelHidden && "sr-only")}>{label}</label>}
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-sm text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm text-bad-ink"><Icon name="alert" size={14} />{error}</p>}
    </div>
  );
}

const control =
  "w-full rounded-control border border-line-strong bg-surface px-3 text-[15px] text-ink placeholder:text-muted transition-colors " +
  "hover:border-ink/50 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-focus aria-invalid:border-bad disabled:opacity-60";

function describedBy(id, hint, error) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function Input({ label, labelHidden, hint, error, icon, className, id: idProp, ...props }) {
  const auto = useId();
  const id = idProp || auto;
  return (
    <FieldShell {...{ id, label, labelHidden, hint, error, className }}>
      <div className="relative">
        {icon && <Icon name={icon} size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />}
        <input id={id} className={cn(control, "h-11", icon && "pl-10")} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...props} />
      </div>
    </FieldShell>
  );
}

export function Select({ label, labelHidden, hint, error, className, id: idProp, children, ...props }) {
  const auto = useId();
  const id = idProp || auto;
  return (
    <FieldShell {...{ id, label, labelHidden, hint, error, className }}>
      <div className="relative">
        <select id={id} className={cn(control, "h-11 cursor-pointer appearance-none pr-10")} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...props}>{children}</select>
        <Icon name="chevron-down" size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
}

export function Textarea({ label, labelHidden, hint, error, className, id: idProp, rows = 4, ...props }) {
  const auto = useId();
  const id = idProp || auto;
  return (
    <FieldShell {...{ id, label, labelHidden, hint, error, className }}>
      <textarea id={id} rows={rows} className={cn(control, "min-h-24 py-2.5")} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...props} />
    </FieldShell>
  );
}
