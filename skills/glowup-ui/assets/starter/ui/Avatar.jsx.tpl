import { cn, hashString } from "./cn.js";

const tones = [
  "bg-primary-soft text-primary-ink", "bg-accent-soft text-accent-ink", "bg-ok-soft text-ok-ink",
  "bg-warn-soft text-warn-ink", "bg-info-soft text-info-ink", "bg-bad-soft text-bad-ink",
];
const sizes = { sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-12 text-base", xl: "size-16 text-xl" };

export const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

// Initials on a soft tone chosen from the name, so each person keeps the same color.
export function Avatar({ name, size = "md", className }) {
  return (
    <span className={cn("inline-grid shrink-0 place-content-center rounded-full font-semibold", tones[hashString(name) % tones.length], sizes[size], className)} role="img" aria-label={name}>
      <span aria-hidden="true">{initials(name)}</span>
    </span>
  );
}

export function AvatarStack({ names = [], max = 4, size = "sm" }) {
  const shown = names.slice(0, max);
  return (
    <span className="flex -space-x-2">
      {shown.map((n) => <Avatar key={n} name={n} size={size} className="ring-2 ring-surface" />)}
      {names.length > max && <span className="inline-grid size-7 place-content-center rounded-full bg-sunken text-[11px] font-semibold text-muted ring-2 ring-surface">+{names.length - max}</span>}
    </span>
  );
}
