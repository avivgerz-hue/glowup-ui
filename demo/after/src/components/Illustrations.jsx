// Plotline motif: a line with dots on graph paper. Decorative only.

function Frame({ children }) {
  return (
    <svg width="220" height="140" viewBox="0 0 220 140" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="gp" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" stroke="#ddd4bf" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0.5" y="0.5" width="219" height="139" rx="4" fill="#fffcf6" stroke="#1c1a16" />
      <rect x="1" y="1" width="218" height="138" fill="url(#gp)" opacity="0.8" />
      {children}
    </svg>
  );
}

// A flat line waiting for its first point.
export function EmptyArt() {
  return (
    <Frame>
      <path d="M20 96H200" stroke="#8a8372" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
      <path d="M20 30v80h180" stroke="#1c1a16" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="110" cy="96" r="7" fill="#fffcf6" stroke="#d6451f" strokeWidth="2.5" />
      <path d="M110 89V58" stroke="#d6451f" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 6" />
    </Frame>
  );
}

// The line breaks off.
export function ErrorArt() {
  return (
    <Frame>
      <path d="M20 110v-80M20 110h180" stroke="#1c1a16" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 98 56 78l28 10 22-24" stroke="#1c1a16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M126 64l8 12M150 52l-4 12" stroke="#c73833" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M160 40l12 20 18-34" stroke="#8a8372" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 7" />
      <circle cx="106" cy="64" r="5" fill="#d6451f" stroke="#fffcf6" strokeWidth="2" />
      <circle cx="84" cy="88" r="4" fill="#1c1a16" />
      <circle cx="56" cy="78" r="4" fill="#1c1a16" />
    </Frame>
  );
}

// Big rising plotline for the login panel.
export function PlotlineArt({ className = "" }) {
  return (
    <svg viewBox="0 0 480 320" fill="none" aria-hidden="true" focusable="false" className={className} preserveAspectRatio="xMidYMid meet">
      <g stroke="#f4efe4" strokeOpacity="0.12">
        {Array.from({ length: 13 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 40} 0V320`} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 40}H480`} />
        ))}
      </g>
      <path
        className="draw-line"
        style={{ "--len": 900 }}
        d="M0 270 C60 262 80 236 120 232 S190 262 230 210 S300 150 340 140 S420 70 480 40"
        stroke="#f4efe4"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[[120, 232], [230, 210], [340, 140]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="6" fill="#1c1a16" stroke="#f4efe4" strokeWidth="2.5" />
      ))}
      <circle cx="430" cy="64" r="9" fill="#d6451f" stroke="#f4efe4" strokeWidth="3" />
      <circle cx="430" cy="64" r="20" stroke="#d6451f" strokeOpacity="0.5" />
    </svg>
  );
}
