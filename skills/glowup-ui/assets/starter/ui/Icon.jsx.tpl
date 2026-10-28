// One icon set on a 24px grid: stroke icons, round caps, inherits currentColor.
// <Icon name="search" size={18} />. Decorative by default (aria-hidden); pass `label` to name it.
const PATHS = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  settings: "M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M9 14v6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4.2-4.2",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-up": "M6 15l6-6 6 6",
  "chevron-right": "M9 6l6 6-6 6",
  "chevron-left": "M15 6l-6 6 6 6",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  "arrow-up-right": "M7 17L17 7M8 7h9v9",
  calendar: "M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  mail: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3.5 7.5l8.5 6 8.5-6",
  phone: "M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z",
  "map-pin": "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  bell: "M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15zM10 21h4",
  menu: "M4 7h16M4 12h16M4 17h16",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  filter: "M4 5h16l-6 8v6l-4-2v-4z",
  "trending-up": "M3 17l6-6 4 4 8-8M15 7h6v6",
  "trending-down": "M3 7l6 6 4-4 8 8M15 17h6v-6",
  alert: "M12 4l9.5 16h-19zM12 10v4.5M12 17.5v.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.01",
  bag: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2",
  box: "M12 3l9 4.5v9L12 21l-9-4.5v-9zM3 7.5l9 4.5 9-4.5M12 12v9",
  heart: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z",
  star: "M12 3.5l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17.3 6.6 20.2l1.1-6.1L3.2 9.9l6.1-.8z",
  card: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3 10h18M7 15h4",
  logout: "M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  inbox: "M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5",
  chart: "M5 20V10M12 20V4M19 20v-7",
  pulse: "M3 12h4l2-6 4 12 2-6h6",
  wallet: "M4 7a2 2 0 0 1 2-2h12v4M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2zM16 14h.01",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10",
  pen: "M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19zM14 7l3 3",
  coffee: "M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3",
  leaf: "M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19c3-4 6-7 10-9",
  gift: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7C9 7 8 3.5 10.5 3.5 12 3.5 12 7 12 7zM12 7c3 0 4-3.5 1.5-3.5C12 3.5 12 7 12 7z",
  tag: "M3 12V4h8l10 10-8 8zM7.5 8.5h.01",
  truck: "M2 6h12v10H2zM14 10h4l3 3v3h-7zM6 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  zap: "M13 3L5 13h6l-1 8 8-10h-6z",
  waves: "M3 9c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1M3 14c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1M3 19c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  copy: "M9 9h11v11H9zM5 15V4h11",
  award: "M12 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8.5 13.5L7 21l5-3 5 3-1.5-7.5",
  droplet: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
};

export const iconNames = Object.keys(PATHS);

export function Icon({ name, size = 18, strokeWidth = 1.75, label, className, ...props }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" {...props}
    >
      <path d={d} />
    </svg>
  );
}
