interface LogoProps {
  className?: string;
  /** 'auto' reads from CSS (default), 'dark' forces black, 'light' forces white */
  variant?: 'auto' | 'dark' | 'light';
  /** Show text beside the hanger icon (default: true) */
  showText?: boolean;
}

/**
 * ClasicCloset wordmark logo.
 *
 * Usage:
 *   <ClasicClosetLogo />                          — full logo, inherits color
 *   <ClasicClosetLogo variant="light" />          — white (on dark backgrounds)
 *   <ClasicClosetLogo showText={false} className="w-8 h-8" />  — icon only
 *
 * The hanger is pure SVG paths — no font dependency.
 * The wordmark uses currentColor so it adapts to any theme.
 */
export function ClasicClosetLogo({
  className = '',
  variant = 'auto',
  showText = true,
}: LogoProps) {
  const colorClass =
    variant === 'light'
      ? 'text-white'
      : variant === 'dark'
      ? 'text-[#0f0f0f]'
      : '';

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${colorClass} ${className}`}
      aria-label="ClasicCloset"
    >
      {/* ── Hanger icon ─────────────────────────────────────────────────────── */}
      {/* All paths use currentColor so the icon always matches the text */}
      <svg
        viewBox="0 0 60 54"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        className="w-9 h-auto shrink-0"
        aria-hidden="true"
      >
        {/* Neck — vertical line from shoulder junction to hook base */}
        <line x1="30" y1="21" x2="30" y2="11" />

        {/* Hook — tight J-curve at the top */}
        <path d="M 30 11 Q 30 4 36 4 Q 42 4 42 11" />

        {/* Left shoulder */}
        <line x1="30" y1="21" x2="4" y2="46" />

        {/* Right shoulder */}
        <line x1="30" y1="21" x2="56" y2="46" />

        {/* Crossbar */}
        <line x1="2" y1="46" x2="58" y2="46" />
      </svg>

      {/* ── Wordmark ──────────────────────────────────────────────────────────*/}
      {showText && (
        <div className="flex flex-col leading-none gap-[3px]">
          <span
            className="text-[13px] font-light tracking-[0.28em] uppercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Clasic
          </span>
          <span
            className="text-[13px] font-bold tracking-[0.28em] uppercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Closet
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Standalone SVG export — use this when you need a pure SVG file
 * (e.g., favicon, open-graph image, external use).
 * Renders at 220×64.
 */
export function ClasicClosetLogoSvg({ dark = true }: { dark?: boolean }) {
  const c = dark ? '#0f0f0f' : '#ffffff';

  return (
    <svg
      viewBox="0 0 220 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ClasicCloset"
    >
      {/* Hanger */}
      <g stroke={c} strokeWidth="2" strokeLinecap="round">
        <line x1="30" y1="26" x2="30" y2="16" />
        <path d="M 30 16 Q 30 10 35 10 Q 40 10 40 16" fill="none" />
        <line x1="30" y1="26" x2="8" y2="48" />
        <line x1="30" y1="26" x2="52" y2="48" />
        <line x1="6" y1="48" x2="54" y2="48" />
      </g>

      {/* "CLASIC" — thin */}
      <text
        x="66"
        y="33"
        fill={c}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="400"
        letterSpacing="5"
      >
        CLASIC
      </text>

      {/* Thin divider */}
      <line x1="66" y1="40" x2="212" y2="40" stroke={c} strokeWidth="0.6" opacity="0.35" />

      {/* "CLOSET" — bold */}
      <text
        x="66"
        y="56"
        fill={c}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        letterSpacing="5"
      >
        CLOSET
      </text>
    </svg>
  );
}
