interface LogoProps {
  className?: string;
  /** 'dark' = black text (default, safe on light backgrounds)
   *  'light' = white text (for dark backgrounds / coloured headers)
   *  'auto'  = inherit colour from parent CSS */
  variant?: 'dark' | 'light' | 'auto';
  showText?: boolean;
}

export function ClasicClosetLogo({
  className = '',
  variant = 'dark',      // ← default is now 'dark' so it's always visible
  showText = true,
}: LogoProps) {
  const colorClass =
    variant === 'light' ? 'text-white' :
    variant === 'dark'  ? 'text-[#111111]' :
    'text-foreground';   // 'auto' falls back to Tailwind's foreground colour

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${colorClass} ${className}`}
      aria-label="ClasicCloset"
    >
      {/* ── Hanger icon ─────────────────────────────────────────────────── */}
      <svg
        viewBox="0 0 60 54"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        className="w-8 h-8 shrink-0"   /* explicit h-8 — h-auto is unreliable on SVG */
        aria-hidden="true"
      >
        {/* Neck */}
        <line x1="30" y1="21" x2="30" y2="11" />
        {/* Hook — tight J-curve */}
        <path d="M 30 11 Q 30 4 36 4 Q 42 4 42 11" fill="none" />
        {/* Left shoulder */}
        <line x1="30" y1="21" x2="4" y2="46" />
        {/* Right shoulder */}
        <line x1="30" y1="21" x2="56" y2="46" />
        {/* Crossbar */}
        <line x1="2" y1="46" x2="58" y2="46" />
      </svg>

      {/* ── Wordmark ──────────────────────────────────────────────────────── */}
      {showText && (
        <div className="flex flex-col leading-none gap-0.5">
          <span className="text-[11px] font-light tracking-[0.3em] uppercase">
            Clasic
          </span>
          <span className="text-[11px] font-black tracking-[0.3em] uppercase">
            Closet
          </span>
        </div>
      )}
    </div>
  );
}

/** Standalone SVG — use for og:image, favicon tooling, or static exports */
export function ClasicClosetLogoSvg({ dark = true }: { dark?: boolean }) {
  const c = dark ? '#111111' : '#ffffff';
  return (
    <svg viewBox="0 0 220 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ClasicCloset">
      <g stroke={c} strokeWidth="2" strokeLinecap="round">
        <line x1="30" y1="26" x2="30" y2="16" />
        <path d="M 30 16 Q 30 10 35 10 Q 40 10 40 16" />
        <line x1="30" y1="26" x2="8" y2="48" />
        <line x1="30" y1="26" x2="52" y2="48" />
        <line x1="6" y1="48" x2="54" y2="48" />
      </g>
      <text x="66" y="33" fill={c} fontFamily="Georgia, serif" fontSize="15" fontWeight="400" letterSpacing="5">CLASIC</text>
      <line x1="66" y1="40" x2="212" y2="40" stroke={c} strokeWidth="0.6" opacity="0.3" />
      <text x="66" y="56" fill={c} fontFamily="Georgia, serif" fontSize="15" fontWeight="700" letterSpacing="5">CLOSET</text>
    </svg>
  );
}
