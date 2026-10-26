import type { GoalState } from "../../lib/goals";

const STROKE: Record<GoalState, string> = {
  met: "stroke-tier-required",
  "on-track": "stroke-tier-mentioned",
  behind: "stroke-warn",
  rest: "stroke-line-strong",
};

/** Circular progress for one goal period. */
export function GoalRing({
  count,
  target,
  state,
  size = 56,
  stroke = 6,
  label,
  children,
}: {
  count: number;
  target: number;
  state: GoalState;
  size?: number;
  stroke?: number;
  label: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fraction = Math.min(1, target ? count / target : 0);
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          className={`${STROKE[state]} transition-[stroke-dashoffset] duration-700 ease-out`}
          style={{ opacity: fraction === 0 ? 0 : 1 }}
        />
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  );
}
