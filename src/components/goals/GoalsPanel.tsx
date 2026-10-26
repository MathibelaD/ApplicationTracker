import { AlertTriangle, Flame, Pencil, Plus, Target, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { formatDateCompact } from "../../lib/format";
import {
  goalSummary,
  PERIOD_ADJECTIVE,
  PERIOD_CURRENT,
  PERIOD_NOUN,
  statusLine,
  type GoalProgress,
  type PeriodResult,
} from "../../lib/goals";
import type { Goal, GoalPeriod } from "../../lib/types";
import { useGoalProgress } from "../../lib/useGoalProgress";
import { buttonClass, cardClass, eyebrowClass } from "../ui/styles";
import { GoalModal } from "./GoalModal";
import { GoalRing } from "./GoalRing";

const STATE_TEXT: Record<GoalProgress["state"], string> = {
  met: "text-ink",
  "on-track": "text-ink-2",
  behind: "text-warn",
  rest: "text-ink-3",
};

/** Goals on the Overview: progress, pace, streak and recent history. */
export function GoalsPanel() {
  const { data: progress = [], goals = [], isLoading } = useGoalProgress();
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  if (isLoading) return null;

  const used = goals.map((g) => g.period);
  const canAdd = used.length < 3;

  return (
    <section id="goals" aria-labelledby="goals-title" className="scroll-mt-24">
      {progress.length === 0 ? (
        <div className={`${cardClass} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6`}>
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-lime text-[#14140f]">
            <Target className="size-5" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 id="goals-title" className="font-semibold">
              Set an application goal
            </h2>
            <p className="mt-0.5 text-sm text-ink-2">
              Something like 2 a day or 10 a week. We'll track it and tell you when you're slipping.
            </p>
          </div>
          <button type="button" onClick={() => setEditing("new")} className={buttonClass("primary")}>
            <Plus className="size-4" aria-hidden /> Set a goal
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 id="goals-title" className="text-lg font-semibold">
              Goals
            </h2>
            {canAdd && (
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-ink"
              >
                <Plus className="size-4" aria-hidden /> Add goal
              </button>
            )}
          </div>
          <div className={`grid grid-cols-1 gap-3 ${progress.length > 1 ? "md:grid-cols-2" : ""} ${progress.length > 2 ? "xl:grid-cols-3" : ""}`}>
            {progress.map((p) => (
              <GoalCard key={p.goal.id} progress={p} onEdit={() => setEditing(p.goal)} />
            ))}
          </div>
        </>
      )}

      <GoalModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        goal={editing && editing !== "new" ? editing : undefined}
        usedPeriods={used}
      />
    </section>
  );
}

function GoalCard({ progress: p, onEdit }: { progress: GoalProgress; onEdit: () => void }) {
  const { goal, current, state, streak } = p;
  return (
    <article className={`${cardClass} flex flex-col p-5 ${state === "behind" ? "border-warn/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={eyebrowClass}>{PERIOD_ADJECTIVE[goal.period]} goal</p>
          <p className="mt-1 truncate text-sm text-ink-2">{goalSummary(goal)}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="-mr-1.5 -mt-1 rounded-lg p-2 text-ink-3 transition hover:bg-surface-2 hover:text-ink"
          aria-label={`Edit ${PERIOD_ADJECTIVE[goal.period].toLowerCase()} goal`}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <GoalRing
          count={current.count}
          target={goal.target}
          state={state}
          size={64}
          label={`${current.count} of ${goal.target} ${PERIOD_CURRENT[goal.period]}`}
        >
          {state === "met" ? (
            <Zap className="size-5 text-tier-required" aria-hidden />
          ) : (
            <span className="text-xs font-semibold tabular-nums text-ink-2">{Math.round(Math.min(1, current.count / goal.target) * 100)}%</span>
          )}
        </GoalRing>
        <div className="min-w-0">
          <p className="font-display text-[40px] leading-none tabular-nums tracking-tight">
            {current.count}
            <span className="text-ink-3">/{goal.target}</span>
          </p>
          <p className="mt-1 text-xs text-ink-3">{PERIOD_CURRENT[goal.period]}</p>
        </div>
      </div>

      <p className={`mt-4 text-sm ${STATE_TEXT[state]}`}>{statusLine(p)}</p>

      <div className="mt-4 flex-1">
        <HistoryBars history={p.history} target={goal.target} period={goal.period} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
        <span className={`inline-flex items-center gap-1.5 ${streak > 0 ? "font-medium text-ink" : "text-ink-3"}`}>
          <Flame className={`size-3.5 ${streak > 0 ? "text-warn" : ""}`} aria-hidden />
          {streak > 0 ? `${streak}-${PERIOD_NOUN[goal.period]} streak` : "No streak yet"}
        </span>
        {state !== "met" && state !== "rest" && (
          <Link to="/applications/new" className="font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
            Add an application
          </Link>
        )}
      </div>
    </article>
  );
}

const RECENT_LABEL: Record<GoalPeriod, string> = { day: "Today", week: "This week", month: "This month" };

/** Recent periods as bars with a dashed target line. Single series, so no legend. */
function HistoryBars({ history: all, target, period }: { history: PeriodResult[]; target: number; period: GoalPeriod }) {
  // Weekend days on a weekdays-only goal aren't part of the goal, so leave them out (but keep today).
  const history = all.filter((h, i) => !h.rest || i === all.length - 1);
  const max = Math.max(target, ...history.map((h) => h.count), 1);
  const targetPct = (target / max) * 100;
  const fmt = (d: Date) =>
    period === "month" ? new Intl.DateTimeFormat(undefined, { month: "short" }).format(d) : formatDateCompact(d);

  return (
    <div>
      <div className="relative flex h-14 items-end gap-[3px]" role="img" aria-label={`Last ${history.length} ${PERIOD_NOUN[period]}s: ${history.map((h) => h.count).join(", ")} against a target of ${target}`}>
        <span
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-3/60"
          style={{ bottom: `${targetPct}%` }}
          aria-hidden
        />
        {history.map((h, i) => {
          const current = i === history.length - 1;
          const tone = h.rest
            ? "bg-line"
            : h.beforeGoal
              ? "bg-line-strong/50"
              : h.met
                ? "bg-tier-required"
                : current
                  ? "bg-tier-mentioned"
                  : "bg-tier-nice";
          const label = `${fmt(h.start)}: ${h.count}${h.rest ? " (weekend)" : h.beforeGoal ? " (before goal)" : h.met ? " · met" : current ? "" : " · missed"}`;
          return (
            <span key={h.start.toISOString()} className="flex h-full flex-1 items-end" title={label}>
              <span
                className={`w-full rounded-t-[4px] ${tone} ${current ? "ring-2 ring-offset-1 ring-offset-surface ring-ink/15" : ""}`}
                style={{ height: h.count === 0 ? "3px" : `${Math.max(8, (h.count / max) * 100)}%` }}
              />
            </span>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
        <span>{fmt(history[0].start)}</span>
        <span>{RECENT_LABEL[period]}</span>
      </div>
    </div>
  );
}

/** The "you're slacking" banner: shown only when a goal is slipping or was just missed. */
export function GoalNudge() {
  const { data: progress = [] } = useGoalProgress();
  const behind = progress.find((p) => p.state === "behind");
  const missed = progress.find((p) => p.missedLast && p.state !== "met" && p.goal.period !== "month");
  const item = behind ?? missed;
  if (!item) return null;

  const { goal } = item;
  const missedDay = item.missedLast && new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(item.missedLast.start);
  const title = behind
    ? `You're falling behind on your ${PERIOD_ADJECTIVE[goal.period].toLowerCase()} goal`
    : goal.period === "day"
      ? `You missed ${missedDay}'s goal`
      : "You missed last week's goal";
  const detail = behind
    ? statusLine(item)
    : `${item.missedLast!.count} of ${goal.target} sent ${goal.period === "day" ? `on ${missedDay}` : "last week"}. ${
        goal.period === "day" ? "Today" : "This week"
      } is a fresh start: ${item.remaining} to go.`;

  return (
    <div role="status" className="flex flex-col gap-3 rounded-2xl border border-warn/30 bg-warn-soft p-4 sm:flex-row sm:items-center sm:p-5">
      <AlertTriangle className="size-5 shrink-0 text-warn" aria-hidden />
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink-2">{detail}</p>
      </div>
      <div className="flex gap-2">
        <Link to="/applications/new" className={buttonClass("primary", "sm")}>
          <Plus className="size-4" aria-hidden /> Add application
        </Link>
      </div>
    </div>
  );
}
