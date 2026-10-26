import { toDateInputValue } from "./format";
import type { Application, Goal, GoalPeriod } from "./types";

const DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Calendar helpers (local time, region-aware week)
// ---------------------------------------------------------------------------

/** ISO weekday: 1 = Monday … 7 = Sunday. */
const isoDay = (d: Date) => d.getDay() || 7;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);

export interface WeekInfo {
  /** ISO weekday the week starts on. */
  firstDay: number;
  /** ISO weekdays that are the weekend. */
  weekend: number[];
}

type LocaleWithWeek = Intl.Locale & {
  getWeekInfo?: () => Partial<WeekInfo>;
  weekInfo?: Partial<WeekInfo>;
};

/** Week start and weekend from the visitor's region (e.g. Sunday in the US, Monday in most of Europe). */
export function regionWeekInfo(locale = typeof navigator !== "undefined" ? navigator.language : "en"): WeekInfo {
  try {
    const loc = new Intl.Locale(locale) as LocaleWithWeek;
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info?.firstDay) return { firstDay: info.firstDay, weekend: info.weekend?.length ? info.weekend : [6, 7] };
  } catch {
    // Older browsers: fall back to ISO weeks.
  }
  return { firstDay: 1, weekend: [6, 7] };
}

export function periodStart(d: Date, period: GoalPeriod, week: WeekInfo): Date {
  if (period === "day") return startOfDay(d);
  if (period === "month") return new Date(d.getFullYear(), d.getMonth(), 1);
  return addDays(startOfDay(d), -((isoDay(d) - week.firstDay + 7) % 7));
}

function nextPeriodStart(start: Date, period: GoalPeriod): Date {
  if (period === "day") return addDays(start, 1);
  if (period === "week") return addDays(start, 7);
  return new Date(start.getFullYear(), start.getMonth() + 1, 1);
}

function previousPeriodStart(start: Date, period: GoalPeriod): Date {
  if (period === "day") return addDays(start, -1);
  if (period === "week") return addDays(start, -7);
  return new Date(start.getFullYear(), start.getMonth() - 1, 1);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface PeriodResult {
  start: Date;
  /** Exclusive. */
  end: Date;
  count: number;
  met: boolean;
  /** Before the goal existed: shown, but never counted as a miss. */
  beforeGoal: boolean;
  /** A weekend day on a weekdays-only daily goal. */
  rest: boolean;
}

export type GoalState = "met" | "on-track" | "behind" | "rest";

export interface GoalProgress {
  goal: Goal;
  current: PeriodResult;
  state: GoalState;
  remaining: number;
  /** Days left in the period, including today. */
  daysLeft: number;
  /** Applications per day needed to still hit the target. */
  perDayNeeded: number;
  /** Consecutive periods met, including the current one once it's met. */
  streak: number;
  /** The last finished period, when it was missed. */
  missedLast: PeriodResult | null;
  /** Oldest first, current period last. */
  history: PeriodResult[];
}

/** Applications sent per calendar day, keyed YYYY-MM-DD. Wishlist items have no applied date. */
export function countsByDay(apps: Pick<Application, "applied_on">[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const a of apps) if (a.applied_on) counts.set(a.applied_on, (counts.get(a.applied_on) ?? 0) + 1);
  return counts;
}

function countRange(counts: Map<string, number>, start: Date, end: Date): number {
  let total = 0;
  for (let d = start; d < end; d = addDays(d, 1)) total += counts.get(toDateInputValue(d)) ?? 0;
  return total;
}

const HISTORY_LENGTH: Record<GoalPeriod, number> = { day: 14, week: 8, month: 6 };

/** Evening cut-off after which an unmet daily goal counts as behind. */
const DAILY_NUDGE_HOUR = 17;

export function goalProgress(
  goal: Goal,
  counts: Map<string, number>,
  now: Date = new Date(),
  week: WeekInfo = regionWeekInfo(),
): GoalProgress {
  const goalStart = periodStart(new Date(goal.created_at), goal.period, week);
  const isRest = (d: Date) => goal.period === "day" && goal.weekdays_only && week.weekend.includes(isoDay(d));

  const result = (start: Date): PeriodResult => {
    const end = nextPeriodStart(start, goal.period);
    const count = countRange(counts, start, end);
    return { start, end, count, met: count >= goal.target, beforeGoal: start < goalStart, rest: isRest(start) };
  };

  const current = result(periodStart(now, goal.period, week));

  // Walk back through finished periods for history, streak and the last miss.
  const past: PeriodResult[] = [];
  let streak = current.met ? 1 : 0;
  let streakOpen = true;
  let missedLast: PeriodResult | null = null;
  let checkedLast = false;
  let cursor = previousPeriodStart(current.start, goal.period);
  for (let i = 0; i < 400 && (past.length < HISTORY_LENGTH[goal.period] || streakOpen); i++) {
    const r = result(cursor);
    if (past.length < HISTORY_LENGTH[goal.period]) past.unshift(r);
    if (!r.rest) {
      if (!checkedLast) {
        checkedLast = true;
        if (!r.met && !r.beforeGoal) missedLast = r;
      }
      if (streakOpen) {
        if (r.met && !r.beforeGoal) streak++;
        else streakOpen = false;
      }
    }
    cursor = previousPeriodStart(cursor, goal.period);
  }

  const totalDays = daysBetween(current.start, current.end);
  const elapsed = daysBetween(current.start, now); // full days before today
  const daysLeft = Math.max(1, totalDays - elapsed);
  const remaining = Math.max(0, goal.target - current.count);

  let state: GoalState;
  if (current.met) state = "met";
  else if (current.rest) state = "rest";
  else if (goal.period === "day") state = now.getHours() >= DAILY_NUDGE_HOUR ? "behind" : "on-track";
  else {
    // Expected by the start of today, so mornings don't count against you.
    const expected = Math.floor((goal.target * elapsed) / totalDays);
    state = current.count < expected ? "behind" : "on-track";
  }

  return {
    goal,
    current,
    state,
    remaining,
    daysLeft,
    perDayNeeded: Math.ceil(remaining / daysLeft),
    streak,
    missedLast,
    history: [...past, current],
  };
}

// ---------------------------------------------------------------------------
// Wording
// ---------------------------------------------------------------------------

export const PERIOD_NOUN: Record<GoalPeriod, string> = { day: "day", week: "week", month: "month" };
export const PERIOD_CURRENT: Record<GoalPeriod, string> = { day: "today", week: "this week", month: "this month" };
export const PERIOD_ADJECTIVE: Record<GoalPeriod, string> = { day: "Daily", week: "Weekly", month: "Monthly" };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function goalSummary(goal: Pick<Goal, "period" | "target" | "weekdays_only">): string {
  const base = `${plural(goal.target, "application")} a ${PERIOD_NOUN[goal.period]}`;
  return goal.period === "day" && goal.weekdays_only ? `${base}, weekdays` : base;
}

/** One line telling the user where they stand. */
export function statusLine(p: GoalProgress): string {
  const { goal, current, remaining, daysLeft, perDayNeeded } = p;
  const when = PERIOD_CURRENT[goal.period];
  switch (p.state) {
    case "met":
      return current.count > goal.target
        ? `Goal smashed: ${current.count} sent ${when}, ${current.count - goal.target} over target.`
        : `Goal met: ${current.count} of ${goal.target} ${when}.`;
    case "rest":
      return current.count > 0 ? `Weekend, but you still sent ${current.count}. Nice.` : "Weekend: no goal today.";
    case "behind":
      if (goal.period === "day") return `Day's nearly over: ${current.count} of ${goal.target}. ${remaining} more to go.`;
      return `Behind pace: ${current.count} of ${goal.target} with ${plural(daysLeft, "day")} left. Aim for ${perDayNeeded} a day.`;
    case "on-track":
      if (goal.period === "day") return `${current.count} of ${goal.target} ${when}. ${remaining} more to hit your goal.`;
      return `On track: ${current.count} of ${goal.target}, ${plural(daysLeft, "day")} left.`;
  }
}

/** The goal to surface in compact spots: anything slipping first. */
export function primaryProgress(list: GoalProgress[]): GoalProgress | undefined {
  const rank: Record<GoalState, number> = { behind: 0, "on-track": 1, rest: 2, met: 3 };
  return [...list].sort((a, b) => rank[a.state] - rank[b.state] || (a.goal.period === "day" ? -1 : 1))[0];
}
