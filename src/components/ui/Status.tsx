import { ChevronDown } from "lucide-react";
import { STATUS_META, STATUS_ORDER } from "../../lib/constants";
import type { ApplicationStatus } from "../../lib/types";

export function StatusBadge({ status, className = "" }: { status: ApplicationStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}

interface StatusSelectProps {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/** A status badge that is also a native select — quick to change, fully accessible. */
export function StatusSelect({ value, onChange, disabled, label = "Status", className = "" }: StatusSelectProps) {
  const meta = STATUS_META[value];
  return (
    <span className={`relative inline-flex ${className}`}>
      <span
        className={`pointer-events-none inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-7 text-xs font-medium ${meta.badge}`}
        aria-hidden
      >
        <span className={`size-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 opacity-60" aria-hidden />
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as ApplicationStatus)}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-wait"
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
    </span>
  );
}
