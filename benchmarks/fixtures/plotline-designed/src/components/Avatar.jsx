// Soft, fixed tints keyed off the initials so each person keeps one colour.
const tints = [
  "bg-primary-soft text-primary-ink",
  "bg-ultra-soft text-ultra",
  "bg-success-soft text-success-ink",
  "bg-warning-soft text-warning-ink",
  "bg-paper-deep text-ink",
];

export default function Avatar({ initials, size = 32 }) {
  const tint = tints[(initials.charCodeAt(0) + initials.charCodeAt(1)) % tints.length];
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ring-1 ring-ink/10 ${tint}`}
    >
      {initials}
    </span>
  );
}
