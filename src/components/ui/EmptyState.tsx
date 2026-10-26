import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-line-strong text-center ${
        compact ? "px-5 py-8" : "px-6 py-14"
      }`}
    >
      <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-surface-2 text-ink-2">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
