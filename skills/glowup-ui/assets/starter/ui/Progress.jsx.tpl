import { cn } from "./cn.js";

const fills = { primary: "bg-primary", accent: "bg-accent", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", info: "bg-info" };
const strokes = { primary: "stroke-primary", accent: "stroke-accent", ok: "stroke-ok", warn: "stroke-warn", bad: "stroke-bad", info: "stroke-info" };
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));

// Keep the number visible as text next to the visual: the bar supplements it, never replaces it.
export function Progress({ value, tone = "primary", label, className }) {
  const v = clamp(value);
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-pill bg-sunken", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-pill transition-[width] duration-500", fills[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 56, tone = "primary", label, children }) {
  const v = clamp(value);
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-content-center" style={{ width: size, height: size }} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" className="stroke-sunken" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} className={cn("transition-[stroke-dashoffset] duration-500", strokes[tone])} />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums text-ink">{children ?? `${v}%`}</span>
    </div>
  );
}
