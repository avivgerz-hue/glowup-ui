import { cn } from "./cn.js";
import { Icon } from "./Icon.jsx";

// Designed empty, error, and loading states. Every list or data view needs all three.
export function EmptyState({ icon = "inbox", title, description, action, className }) {
  return (
    <div className={cn("grid min-w-0 place-items-center rounded-card border border-dashed border-line-strong bg-sunken/40 px-6 py-14 text-center", className)}>
      <span className="mb-4 grid size-12 place-content-center rounded-full bg-primary-soft text-primary-ink"><Icon name={icon} size={22} /></span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry, retryLabel = "Try again", className }) {
  return (
    <div role="alert" className={cn("grid min-w-0 place-items-center rounded-card border border-line bg-bad-soft/50 px-6 py-12 text-center", className)}>
      <span className="mb-4 grid size-12 place-content-center rounded-full bg-bad-soft text-bad-ink"><Icon name="alert" size={22} /></span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {onRetry && <button type="button" onClick={onRetry} className="mt-5 inline-flex h-11 items-center rounded-control border border-line-strong bg-surface px-4 text-[15px] font-medium hover:bg-sunken">{retryLabel}</button>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-control bg-sunken", className)} />;
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}
