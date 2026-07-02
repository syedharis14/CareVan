export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden="true">
        <rect width="512" height="512" rx="112" fill="#0F4C81" />
        <g transform="translate(0,-14)">
          <path
            d="M140 195 Q140 357 256 357 Q372 357 372 195"
            fill="none"
            stroke="#1B873F"
            strokeWidth="46"
            strokeLinecap="round"
          />
          <rect x="161" y="165" width="190" height="88" rx="26" fill="#FFFFFF" />
          <rect x="193" y="181" width="38" height="30" rx="8" fill="#CFE0EF" />
          <rect x="237" y="181" width="38" height="30" rx="8" fill="#CFE0EF" />
          <rect x="281" y="181" width="38" height="30" rx="8" fill="#CFE0EF" />
          <circle cx="196" cy="257" r="22" fill="#1A2430" />
          <circle cx="316" cy="257" r="22" fill="#1A2430" />
        </g>
      </svg>
      <span
        className="font-medium tracking-tight"
        style={{ color: '#0F4C81', fontSize: size * 0.72 }}
      >
        CareVan
      </span>
      <span className="sr-only">CareVan admin</span>
    </span>
  );
}
