import { cn } from "./cn.js";

// One h1 per page, one primary action. `eyebrow` is a small label above the title.
export function PageHeader({ title, description, eyebrow, actions, className }) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-muted">{eyebrow}</p>}
        <h1 className="text-[1.75rem] leading-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-prose text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
