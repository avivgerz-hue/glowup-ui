const paths = {
  dashboard: (
    <>
      <path d="M4 5h6v7H4zM14 5h6v4h-6zM14 13h6v6h-6zM4 16h6v3H4z" />
    </>
  ),
  projects: (
    <>
      <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19c.4-3.2 2.8-5 6-5s5.6 1.8 6 5" />
      <path d="M16 5.6a3 3 0 0 1 0 5.8M18 14.4c1.8.6 2.8 2.2 3 4.6" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 4 3 19.5h18z" />
      <path d="M12 10v4.5M12 17.4v.1" />
    </>
  ),
  pause: <path d="M9 6v12M15 6v12" />,
  pulse: <path d="M3 12h4l2.5-6 4 12L16 12h5" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6H18v3" />
      <path d="M4 7.5V17a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 17v-7a1 1 0 0 0-1-1H5.5A1.5 1.5 0 0 1 4 7.5z" />
      <path d="M16 13.5h.1" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7.5 8 6 8-6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c.6-3.4 3.2-5 7-5s6.4 1.6 7 5" />
    </>
  ),
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7M10.5 11v5M13.5 11v5" />,
  refresh: <path d="M19 8a7.5 7.5 0 0 0-13.2-1.5L4 9M4 4v5h5M5 16a7.5 7.5 0 0 0 13.2 1.5L20 15M20 20v-5h-5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.75 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {paths[name]}
    </svg>
  );
}

export function LogoMark({ size = 28, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path d="M5 22.5 11.5 17l5 3.5L22 11l5-2.5" stroke="#f4efe4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="11" r="3" fill="#d6451f" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
