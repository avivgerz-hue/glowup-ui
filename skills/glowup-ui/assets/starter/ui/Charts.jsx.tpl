import { useId } from "react";
import { cn } from "./cn.js";

// Dependency-free SVG charts that use the theme's color roles. Always give `label` (a one-sentence summary)
// so the chart has a text equivalent, and show the key number as text next to it.
const text = { primary: "text-primary", accent: "text-accent", ok: "text-ok", warn: "text-warn", bad: "text-bad", info: "text-info" };
const PAD = { l: 8, r: 8, t: 18, b: 24 };
const nice = (max) => { const p = 10 ** Math.floor(Math.log10(max || 1)); return Math.ceil(max / p) * p; };

export function Sparkline({ data, tone = "primary", height = 36, width = 120, label, className }) {
  const id = useId();
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1 || 1)) * width, height - 3 - ((v - min) / span) * (height - 6)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={cn(text[tone], className)} role="img" aria-label={label} aria-hidden={label ? undefined : true}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".22" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      <path d={`${d}L${width} ${height}L0 ${height}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// data: [{ label, value }]. Responsive: scales to its container width.
export function LineChart({ data, tone = "primary", height = 220, format = (v) => String(v), label, className }) {
  const id = useId();
  const W = 640, H = height;
  const max = nice(Math.max(...data.map((d) => d.value))), min = 0;
  const x = (i) => PAD.l + (i / (data.length - 1 || 1)) * (W - PAD.l - PAD.r);
  const y = (v) => PAD.t + (1 - (v - min) / (max - min || 1)) * (H - PAD.t - PAD.b);
  const d = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join("");
  const ticks = [0, 0.5, 1].map((t) => min + t * (max - min));
  const every = Math.ceil(data.length / 7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full", text[tone], className)} role="img" aria-label={label}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".18" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : "3 4"} />
          <text x={PAD.l + 2} y={y(t) - 4} fontSize="12" fill="var(--color-muted)">{format(t)}</text>
        </g>
      ))}
      <path d={`${d}L${x(data.length - 1)} ${y(0)}L${x(0)} ${y(0)}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].value)} r="4" fill="currentColor" stroke="var(--color-surface)" strokeWidth="2" />
      {data.map((p, i) => i % every === 0 && <text key={p.label} x={x(i)} y={H - 7} fontSize="12" textAnchor="middle" fill="var(--color-muted)">{p.label}</text>)}
    </svg>
  );
}

// data: [{ label, value, tone? }]. Horizontal bars: readable labels, values as text.
export function BarList({ data, tone = "primary", format = (v) => String(v), className }) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const fills = { primary: "bg-primary", accent: "bg-accent", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", info: "bg-info" };
  return (
    <ul className={cn("space-y-3", className)}>
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="truncate">{d.label}</span><span className="num font-medium">{format(d.value)}</span></div>
          <div className="h-2 overflow-hidden rounded-pill bg-sunken" aria-hidden="true"><div className={cn("h-full rounded-pill", fills[d.tone || tone])} style={{ width: `${(d.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

// Vertical columns. data: [{ label, value }]; highlight the last by default.
export function ColumnChart({ data, tone = "primary", height = 180, highlight = data.length - 1, label, className }) {
  const W = 480, H = height, every = Math.ceil(data.length / 8), max = nice(Math.max(...data.map((d) => d.value)));
  const bw = (W - PAD.l - PAD.r) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full", text[tone], className)} role="img" aria-label={label}>
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--color-line)" />
      {data.map((d, i) => {
        const h = (d.value / max) * (H - PAD.t - PAD.b);
        return (
          <g key={d.label}>
            <rect x={PAD.l + i * bw + bw * 0.18} y={H - PAD.b - h} width={bw * 0.64} height={h} rx="3" fill="currentColor" opacity={i === highlight ? 1 : 0.35} />
            {i % every === 0 && <text x={PAD.l + i * bw + bw / 2} y={H - 7} fontSize="12" textAnchor="middle" fill="var(--color-muted)">{d.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// parts: [{ label, value, tone }]. Donut with the total (or any node) in the center.
export function Donut({ parts, size = 160, thickness = 18, label, children }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  const strokes = { primary: "var(--color-primary)", accent: "var(--color-accent)", ok: "var(--color-ok)", warn: "var(--color-warn)", bad: "var(--color-bad)", info: "var(--color-info)" };
  let off = 0;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sunken)" strokeWidth={thickness} />
        {parts.map((p) => {
          const len = (p.value / total) * c, el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={strokes[p.tone] || p.tone} strokeWidth={thickness} strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-off} />;
          off += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">{children}</div>
    </div>
  );
}
