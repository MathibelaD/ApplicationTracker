export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-ink" />
      <rect x="7" y="9" width="18" height="3" rx="1.5" className="fill-bg" />
      <rect x="7" y="14.5" width="13" height="3" rx="1.5" className="fill-bg" opacity=".6" />
      <rect x="7" y="20" width="8" height="3" rx="1.5" fill="#D4EE6A" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[22px] leading-none tracking-tight">SmartWebSync Application Tracker</span>
    </span>
  );
}
