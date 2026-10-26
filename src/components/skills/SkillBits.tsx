import { Check, Plus } from "lucide-react";
import { TIER_LABEL, TIER_ORDER, TIER_SWATCH } from "../../lib/skills/tiers";

export function TierLegend({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2 ${className}`} aria-label="Legend">
      {TIER_ORDER.map((t) => (
        <li key={t} className="inline-flex items-center gap-1.5">
          <span className={`size-2.5 rounded-[3px] ${TIER_SWATCH[t]}`} aria-hidden />
          {TIER_LABEL[t]}
        </li>
      ))}
    </ul>
  );
}

/** "+ Add" / "✓ Have" toggle for a skill. */
export function HaveToggle({
  label,
  have,
  onToggle,
  compact,
}: {
  label: string;
  have: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={have}
      aria-label={have ? `Remove ${label} from my skills` : `Add ${label} to my skills`}
      title={have ? "In your skills — click to remove" : "Add to my skills"}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full text-xs font-medium transition ${
        compact ? "size-7 justify-center" : "px-2.5 py-1"
      } ${
        have
          ? "bg-accent-soft text-accent-soft-ink hover:opacity-80"
          : "border border-line text-ink-2 hover:border-line-strong hover:text-ink"
      }`}
    >
      {have ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
      {!compact && (have ? "Have" : "Add")}
    </button>
  );
}
