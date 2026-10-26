import { useEffect, useRef } from "react";
import { useToast } from "../components/ui/Toast";
import { PERIOD_ADJECTIVE, type GoalState } from "./goals";
import { useGoalProgress } from "./useGoalProgress";

/** Toasts once when a goal flips to met during this session. */
export function useGoalCelebration() {
  const { data } = useGoalProgress();
  const toast = useToast();
  const previous = useRef<Map<string, GoalState> | null>(null);

  useEffect(() => {
    if (!data) return;
    const prev = previous.current;
    if (prev) {
      for (const p of data) {
        const before = prev.get(p.goal.id);
        if (before && before !== "met" && p.state === "met") {
          toast.success(
            `${PERIOD_ADJECTIVE[p.goal.period]} goal met: ${p.current.count} of ${p.goal.target}${
              p.streak > 1 ? `. That's a ${p.streak}-${p.goal.period} streak` : ""
            }.`,
          );
        }
      }
    }
    previous.current = new Map(data.map((p) => [p.goal.id, p.state]));
  }, [data, toast]);
}
