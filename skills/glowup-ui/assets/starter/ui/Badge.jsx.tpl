import { cn } from "./cn.js";

const tones = {
  neutral: "bg-sunken text-muted",
  primary: "bg-primary-soft text-primary-ink",
  accent: "bg-accent-soft text-accent-ink",
  ok: "bg-ok-soft text-ok-ink",
  warn: "bg-warn-soft text-warn-ink",
  bad: "bg-bad-soft text-bad-ink",
  info: "bg-info-soft text-info-ink",
};

// Status chip. Always pair color with the word (and optionally a dot): never color alone.
export function Badge({ tone = "neutral", dot = false, className, children, ...props }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-xs font-medium", tones[tone], className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
