import { statusColor } from "./StatusBadge.jsx";

// Decorative: the percentage is always printed beside it.
export function ProgressBar({ value, status = "active", className = "" }) {
  return (
    <span aria-hidden="true" className={`block h-1.5 w-full overflow-hidden rounded-full bg-paper-deep ${className}`}>
      <span
        className="grow-x block h-full rounded-full"
        style={{ width: `${value}%`, background: statusColor[status] }}
      />
    </span>
  );
}

export function ProgressRing({ value, status = "active", size = 88 }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" aria-hidden="true" focusable="false">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#ebe4d3" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke={statusColor[status]}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform="rotate(-90 44 44)"
      />
    </svg>
  );
}
