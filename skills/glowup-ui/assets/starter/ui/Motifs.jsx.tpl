import { useId } from "react";
import { cn } from "./cn.js";

// Decorative backdrops drawn with currentColor, so color comes from a text utility: <Rings className="text-primary/20" />.
// Put one inside a `relative overflow-hidden` parent (hero, panel, auth side, footer band, empty state); they never intercept clicks.
// Pick the motif the direction names (contour lines, rules, stitched edges, grid paper, arches, waves, dots) and reuse it only where it supports the content.
const base = "pointer-events-none absolute inset-0 size-full";

export function Rings({ className, count = 7 }) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 400 400" preserveAspectRatio="xMaxYMid slice" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <circle key={i} cx="300" cy="200" r={40 + i * 36} />)}
    </svg>
  );
}

export function Waves({ className, rows = 8 }) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 400 300" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => <path key={i} d={`M0 ${30 + i * 32} C 80 ${i * 32} 120 ${60 + i * 32} 200 ${30 + i * 32} S 340 ${i * 32} 400 ${30 + i * 32}`} />)}
    </svg>
  );
}

export function Contours({ className }) {
  const loops = [150, 120, 92, 66, 42, 20];
  return (
    <svg className={cn(base, className)} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
      {loops.map((r, i) => <path key={r} d={`M${200 - r * 1.5} ${150 + i * 3} C ${200 - r} ${150 - r * 1.1} ${200 + r * 0.6} ${150 - r * 1.2} ${200 + r * 1.4} ${150 - i * 2} S ${200 + r} ${150 + r * 1.2} ${200 - r * 0.2} ${150 + r * 0.9} S ${200 - r * 1.6} ${150 + r * 0.6} ${200 - r * 1.5} ${150 + i * 3}Z`} />)}
    </svg>
  );
}

export function GridPaper({ className, size = 32 }) {
  const id = useId();
  return (
    <svg className={cn(base, className)} aria-hidden="true">
      <defs><pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse"><path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function Dots({ className, gap = 22, r = 1.6 }) {
  const id = useId();
  return (
    <svg className={cn(base, className)} aria-hidden="true">
      <defs><pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse"><circle cx={gap / 2} cy={gap / 2} r={r} fill="currentColor" /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function Stripes({ className, gap = 14 }) {
  const id = useId();
  return (
    <svg className={cn(base, className)} aria-hidden="true">
      <defs><pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2={gap} stroke="currentColor" strokeWidth="2" /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function Blob({ className }) {
  return (
    <svg className={cn(base, className)} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" fill="currentColor" aria-hidden="true">
      <path d="M312 70c42 36 62 94 38 146s-92 92-150 92-110-38-130-92 0-118 46-154S270 34 312 70z" />
    </svg>
  );
}

// Arch frame (spa, wellness, editorial): a tall rounded-top window that holds an illustration, a tint, or a gradient.
export function Arch({ className, children }) {
  return (
    <div className={cn("relative isolate grid place-items-center overflow-hidden rounded-t-[999px] bg-primary-soft text-primary-ink", className)}>
      <Contours className="-z-10 text-current opacity-30" />
      {children}
    </div>
  );
}

// A band of repeated small marks, e.g. a stitched or perforated edge: <Edge className="text-line-strong" />
export function Edge({ className, dash = "6 6" }) {
  return (
    <svg className={cn("pointer-events-none block h-1 w-full", className)} preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="2" x2="100%" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray={dash} />
    </svg>
  );
}
