// Join class names, skipping falsy values.
export const cn = (...parts) => parts.flat().filter(Boolean).join(" ");

// Small deterministic hash, used to pick a stable color or pattern per item.
export function hashString(text) {
  let h = 2166136261;
  for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
