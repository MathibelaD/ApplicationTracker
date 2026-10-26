import { Link } from "react-router";
import { PERIOD_ADJECTIVE, PERIOD_CURRENT, primaryProgress, type GoalState } from "../../lib/goals";
import { useGoalProgress } from "../../lib/useGoalProgress";
import { GoalRing } from "./GoalRing";

const STATE_WORD: Record<GoalState, string> = {
  met: "Done",
  "on-track": "On track",
  behind: "Behind",
  rest: "Rest day",
};

/** Compact goal status for the sidebar (full) and the phone header (ring only). */
export function GoalBadge({ compact }: { compact?: boolean }) {
  const { data } = useGoalProgress();
  const p = data && primaryProgress(data);
  if (!p) return null;

  const { goal, current, state } = p;
  const label = `${PERIOD_ADJECTIVE[goal.period]} goal: ${current.count} of ${goal.target} ${PERIOD_CURRENT[goal.period]}, ${STATE_WORD[state].toLowerCase()}`;

  if (compact) {
    return (
      <Link to="/#goals" aria-label={label} title={label} className="relative inline-flex rounded-full p-1">
        <GoalRing count={current.count} target={goal.target} state={state} size={30} stroke={4} label={label}>
          <span className={`text-[10px] font-semibold tabular-nums ${state === "behind" ? "text-warn" : "text-ink-2"}`}>
            {current.count}
          </span>
        </GoalRing>
      </Link>
    );
  }

  return (
    <Link
      to="/#goals"
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-line-strong"
      aria-label={label}
    >
      <GoalRing count={current.count} target={goal.target} state={state} size={38} stroke={5} label={label} />
      <span className="min-w-0">
        <span className="block text-sm font-medium tabular-nums">
          {current.count} of {goal.target} {PERIOD_CURRENT[goal.period]}
        </span>
        <span className={`block text-xs ${state === "behind" ? "font-medium text-warn" : "text-ink-3"}`}>
          {STATE_WORD[state]}
        </span>
      </span>
    </Link>
  );
}
