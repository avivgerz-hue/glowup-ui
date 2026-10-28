import { cn } from "./cn.js";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium select-none " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-wait";

const variants = {
  primary: "bg-primary text-on-primary shadow-card hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
  danger: "border border-transparent bg-bad-soft text-bad-ink hover:brightness-95",
  accent: "bg-accent-soft text-accent-ink hover:brightness-95",
};
const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-[15px]", lg: "h-12 px-6 text-base" };

/** Class names for a button look, so links can share it: <Link className={buttonClass({ variant: "primary" })}>. */
export const buttonClass = ({ variant = "primary", size = "md", className } = {}) => cn(base, variants[variant], sizes[size], className);

export function Button({ variant = "primary", size = "md", loading = false, icon, className, children, disabled, type = "button", ...props }) {
  return (
    <button type={type} className={buttonClass({ variant, size, className })} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
