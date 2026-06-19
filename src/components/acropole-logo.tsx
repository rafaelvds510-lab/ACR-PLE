export function AcropoleLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ac-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--gold)" />
          <stop offset="1" stopColor="var(--bronze)" />
        </linearGradient>
      </defs>
      <path d="M4 40h40" stroke="url(#ac-g)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 36V20l16-10 16 10v16" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="22" width="3" height="14" fill="currentColor" />
      <rect x="18" y="22" width="3" height="14" fill="currentColor" />
      <rect x="27" y="22" width="3" height="14" fill="currentColor" />
      <rect x="34" y="22" width="3" height="14" fill="currentColor" />
      <path d="M8 20l16-10 16 10" stroke="url(#ac-g)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="14" r="1.5" fill="url(#ac-g)" />
    </svg>
  );
}
