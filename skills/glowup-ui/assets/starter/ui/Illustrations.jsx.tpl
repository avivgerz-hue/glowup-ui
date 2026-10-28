import { cn } from "./cn.js";

// Flat, palette-colored illustrations of common things, so stores, spas, and apps do not ship monograms or gray boxes.
// They use the theme's color roles, so they re-skin with the direction. Drop one inside <ArtTile>, a hero, or an empty state:
//   <ArtTile seed={p.id}><Illustration name="notebook" /></ArtTile>      or      <Illustration name="stones" className="w-40" />
// Names: notebook pen mug tote plant candle stones drop parcel chart wallet ticket calendar shield
const P = "var(--color-primary)", A = "var(--color-accent)", S = "var(--color-surface)", I = "var(--color-ink)", L = "var(--color-line-strong)";

const ART = {
  notebook: (<><rect x="30" y="16" width="62" height="88" rx="6" fill={P} /><rect x="38" y="16" width="54" height="88" rx="5" fill={A} opacity=".9" /><rect x="30" y="16" width="10" height="88" rx="4" fill={I} opacity=".28" /><rect x="50" y="34" width="30" height="5" rx="2.5" fill={S} opacity=".85" /><rect x="50" y="46" width="22" height="4" rx="2" fill={S} opacity=".6" /><rect x="64" y="88" width="20" height="8" rx="2" fill={S} opacity=".8" /></>),
  pen: (<><g transform="rotate(35 60 60)"><rect x="52" y="10" width="16" height="70" rx="6" fill={P} /><rect x="52" y="30" width="16" height="6" fill={A} /><path d="M52 80h16l-8 28z" fill={I} opacity=".85" /><rect x="58" y="16" width="4" height="26" rx="2" fill={S} opacity=".5" /></g></>),
  mug: (<><path d="M30 38h50v38a20 20 0 0 1-20 20h-10a20 20 0 0 1-20-20z" fill={P} /><path d="M80 48h8a12 12 0 0 1 0 24h-8" fill="none" stroke={P} strokeWidth="8" /><rect x="30" y="38" width="50" height="10" fill={A} opacity=".9" /><path d="M46 28c-4-6 4-8 0-14M60 28c-4-6 4-8 0-14" fill="none" stroke={L} strokeWidth="3" strokeLinecap="round" /></>),
  tote: (<><path d="M38 40c0-22 44-22 44 0" fill="none" stroke={I} strokeWidth="5" opacity=".6" /><path d="M28 40h64l6 62H22z" fill={A} /><rect x="44" y="62" width="32" height="22" rx="4" fill={S} opacity=".85" /><circle cx="60" cy="73" r="5" fill={P} /></>),
  plant: (<><path d="M60 76C48 62 44 44 56 28c10 16 8 34 4 48z" fill={P} /><path d="M60 76c10-10 24-14 34-8-6 12-20 16-34 8z" fill={A} /><path d="M60 76c-8-6-22-6-32 2 8 10 22 10 32-2z" fill={P} opacity=".7" /><path d="M42 80h36l-5 26H47z" fill={I} opacity=".8" /></>),
  candle: (<><path d="M60 10c9 12 8 20 0 24-8-4-9-12 0-24z" fill={A} /><rect x="46" y="38" width="28" height="64" rx="5" fill={S} stroke={L} strokeWidth="2.5" /><rect x="46" y="38" width="28" height="14" rx="5" fill={P} opacity=".85" /><rect x="58.5" y="34" width="3" height="8" fill={I} /></>),
  stones: (<><ellipse cx="60" cy="92" rx="42" ry="14" fill={P} /><ellipse cx="60" cy="68" rx="30" ry="11" fill={A} /><ellipse cx="60" cy="48" rx="19" ry="8" fill={I} opacity=".78" /><path d="M50 28c-3-5 3-6 0-11M66 28c-3-5 3-6 0-11" fill="none" stroke={L} strokeWidth="3" strokeLinecap="round" /></>),
  drop: (<><path d="M60 14C84 44 92 58 92 74a32 32 0 0 1-64 0c0-16 8-30 32-60z" fill={P} /><path d="M44 74a16 16 0 0 0 16 16" fill="none" stroke={S} strokeWidth="5" strokeLinecap="round" opacity=".7" /><ellipse cx="46" cy="52" rx="4" ry="9" fill={S} opacity=".35" transform="rotate(25 46 52)" /></>),
  parcel: (<><path d="M20 40l40-20 40 20v44l-40 20-40-20z" fill={A} /><path d="M20 40l40 20 40-20" fill="none" stroke={S} strokeWidth="3" opacity=".8" /><path d="M60 60v44" stroke={S} strokeWidth="3" opacity=".8" /><path d="M40 30l40 20v14" fill="none" stroke={P} strokeWidth="6" /></>),
  chart: (<><rect x="16" y="72" width="16" height="30" rx="3" fill={A} /><rect x="40" y="52" width="16" height="50" rx="3" fill={P} opacity=".8" /><rect x="64" y="36" width="16" height="66" rx="3" fill={P} /><rect x="88" y="16" width="16" height="86" rx="3" fill={I} opacity=".78" /><path d="M16 56l28-18 24 6 36-30" fill="none" stroke={A} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></>),
  wallet: (<><rect x="16" y="30" width="88" height="62" rx="9" fill={P} /><path d="M16 46h88" stroke={I} strokeWidth="3" opacity=".3" /><rect x="70" y="56" width="42" height="26" rx="8" fill={A} /><circle cx="84" cy="69" r="4.5" fill={S} /><rect x="22" y="18" width="62" height="20" rx="5" fill={L} opacity=".8" /></>),
  ticket: (<><path d="M14 36h92v16a8 8 0 0 0 0 16v16H14V68a8 8 0 0 0 0-16z" fill={A} /><path d="M76 36v52" stroke={S} strokeWidth="3" strokeDasharray="5 5" /><rect x="26" y="50" width="38" height="5" rx="2.5" fill={S} opacity=".9" /><rect x="26" y="62" width="26" height="5" rx="2.5" fill={S} opacity=".6" /><circle cx="92" cy="62" r="8" fill={P} /></>),
  calendar: (<><rect x="18" y="26" width="84" height="76" rx="9" fill={S} stroke={L} strokeWidth="2.5" /><path d="M18 35a9 9 0 0 1 9-9h66a9 9 0 0 1 9 9v13H18z" fill={P} /><rect x="34" y="14" width="7" height="22" rx="3.5" fill={I} opacity=".8" /><rect x="79" y="14" width="7" height="22" rx="3.5" fill={I} opacity=".8" />{[0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={30 + c * 19} y={58 + r * 15} width="11" height="9" rx="2.5" fill={r === 1 && c === 2 ? A : L} opacity={r === 1 && c === 2 ? 1 : 0.6} />))}</>),
  shield: (<><path d="M60 12l38 14v30c0 24-16 40-38 50-22-10-38-26-38-50V26z" fill={P} /><path d="M60 12l38 14v30c0 24-16 40-38 50z" fill={I} opacity=".16" /><path d="M42 60l14 14 24-28" fill="none" stroke={S} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></>),
};

export const illustrationNames = Object.keys(ART);

export function Illustration({ name, className, label }) {
  const art = ART[name];
  if (!art) return null;
  return (
    <svg viewBox="0 0 120 120" className={cn("block h-auto w-full", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      {art}
    </svg>
  );
}
