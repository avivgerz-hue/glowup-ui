import { cn } from "./cn.js";

export function Card({ as: Tag = "div", padded = true, className, children, ...props }) {
  return (
    <Tag className={cn("min-w-0 rounded-card border border-line bg-surface shadow-card", padded && "p-5 sm:p-6", className)} style={{ borderWidth: "var(--card-border, 1px)" }} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
