// A padel court seen from above, drawn to scale (20 x 10 m), used as artwork in hero areas.
// Lines are white on brand blue; the lime ball repeats the logo.
export function TerenCrtez({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 130" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="podloga" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.56 0.17 256)" />
          <stop offset="1" stopColor="oklch(0.42 0.15 260)" />
        </linearGradient>
        <linearGradient id="staklo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.35" />
          <stop offset="1" stopColor="white" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="loptica" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="oklch(0.96 0.17 125)" />
          <stop offset="1" stopColor="oklch(0.82 0.2 128)" />
        </radialGradient>
      </defs>
      {/* Glass walls around the court */}
      <rect x="6" y="6" width="228" height="118" rx="10" fill="url(#staklo)" stroke="white" strokeOpacity="0.35" />
      <rect x="20" y="15" width="200" height="100" rx="3" fill="url(#podloga)" />
      <g stroke="white" strokeOpacity="0.92" strokeWidth="1.4" fill="none">
        <rect x="20" y="15" width="200" height="100" rx="3" />
        {/* Service lines 6.95 m from the net, center line between them */}
        <line x1="50.5" y1="15" x2="50.5" y2="115" />
        <line x1="189.5" y1="15" x2="189.5" y2="115" />
        <line x1="50.5" y1="65" x2="189.5" y2="65" />
      </g>
      {/* Net */}
      <line x1="120" y1="11" x2="120" y2="119" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="120" y1="11" x2="120" y2="119" stroke="oklch(0.2 0.05 262)" strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
      <ellipse cx="163" cy="92" rx="7" ry="2.4" fill="black" opacity="0.25" />
      <circle cx="161" cy="86" r="6" fill="url(#loptica)" />
      <path d="M156.5 83.5c3 1.6 6 1.6 9 0" stroke="white" strokeOpacity="0.7" strokeWidth="0.9" fill="none" />
    </svg>
  );
}
