import { useMemo, useSyncExternalStore } from "react";
import { countsByDay, goalProgress, regionWeekInfo, type GoalProgress, type WeekInfo } from "./goals";
import { useApplications, useGoals } from "./queries";

// ---------------------------------------------------------------------------
// Week start preference (per device): follow the region, or force Monday / Sunday
// ---------------------------------------------------------------------------

export type WeekStartPref = "region" | "monday" | "sunday";

const listeners = new Set<() => void>();

function readPref(): WeekStartPref {
  try {
    const v = localStorage.getItem("week-start");
    if (v === "monday" || v === "sunday") return v;
  } catch {
    // storage blocked
  }
  return "region";
}

let pref = readPref();

export function setWeekStart(next: WeekStartPref) {
  pref = next;
  try {
    localStorage.setItem("week-start", next);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function useWeekInfo(): { week: WeekInfo; pref: WeekStartPref; regionFirstDay: number } {
  const current = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pref,
  );
  return useMemo(() => {
    const region = regionWeekInfo();
    const firstDay = current === "monday" ? 1 : current === "sunday" ? 7 : region.firstDay;
    return { week: { ...region, firstDay }, pref: current, regionFirstDay: region.firstDay };
  }, [current]);
}

// ---------------------------------------------------------------------------

export function useGoalProgress() {
  const goals = useGoals();
  const apps = useApplications();
  const { week } = useWeekInfo();

  const data = useMemo<GoalProgress[] | undefined>(() => {
    if (!goals.data || !apps.data) return undefined;
    const counts = countsByDay(apps.data);
    const now = new Date();
    const order = { day: 0, week: 1, month: 2 };
    return [...goals.data].sort((a, b) => order[a.period] - order[b.period]).map((g) => goalProgress(g, counts, now, week));
  }, [goals.data, apps.data, week]);

  return { data, goals: goals.data, isLoading: goals.isLoading || apps.isLoading, error: goals.error };
}
