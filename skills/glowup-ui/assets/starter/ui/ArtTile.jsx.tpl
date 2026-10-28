import { cn, hashString } from "./cn.js";
import { Icon } from "./Icon.jsx";

// Imagery without photos: a palette-colored field with a deterministic inline-SVG pattern per seed.
//   <ArtTile seed={product.id} label={product.name} icon="box" className="aspect-[4/5]" />
// Best result: pass an inline-SVG illustration of the actual product as `children` (flat shapes, 3-6 of them, palette colors via
// currentColor or var(--color-*)); it is centered over the pattern. `icon` is the quick fallback, `mark` (letters) the last resort.
const fields = [
  "bg-primary-soft text-primary-ink", "bg-accent-soft text-accent-ink", "bg-ok-soft text-ok-ink",
  "bg-warn-soft text-warn-ink", "bg-info-soft text-info-ink", "bg-sunken text-ink",
];

function Pattern({ n }) {
  const k = n % 5;
  if (k === 0) return <g fill="currentColor" opacity=".16"><circle cx="70" cy="70" r="46" /><circle cx="118" cy="118" r="30" opacity=".6" /></g>;
  if (k === 1) return <g fill="none" stroke="currentColor" strokeWidth="2" opacity=".28">{[16, 34, 52, 70].map((r) => <circle key={r} cx="100" cy="100" r={r + 20} />)}</g>;
  if (k === 2) return <g fill="currentColor" opacity=".18">{Array.from({ length: 36 }, (_, i) => <circle key={i} cx={20 + (i % 6) * 32} cy={20 + Math.floor(i / 6) * 32} r="3.5" />)}</g>;
  if (k === 3) return <g fill="currentColor" opacity=".16"><rect x="40" y="52" width="120" height="96" rx="10" /><rect x="64" y="28" width="72" height="30" rx="8" opacity=".7" /></g>;
  return <g fill="none" stroke="currentColor" strokeWidth="2" opacity=".26">{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M0 ${40 + i * 18} Q 50 ${10 + i * 18} 100 ${40 + i * 18} T 200 ${40 + i * 18}`} />)}</g>;
}

export function ArtTile({ seed = "", label, className, mark, icon, children }) {
  const n = hashString(String(seed));
  return (
    <div className={cn("relative isolate grid place-items-center overflow-hidden rounded-card", fields[n % fields.length], className)}>
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 -z-10 size-full" aria-hidden="true"><Pattern n={n >> 3} /></svg>
      {children && <div className="grid size-3/5 place-items-center [&>svg]:size-full" aria-hidden="true">{children}</div>}
      {!children && icon && <Icon name={icon} size={56} strokeWidth={1.25} className="opacity-80" />}
      {!children && !icon && mark && <span className="font-display text-5xl font-semibold opacity-80" aria-hidden="true">{mark}</span>}
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
