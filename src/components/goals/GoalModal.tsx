import { Minus, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { goalSummary, PERIOD_ADJECTIVE, PERIOD_NOUN } from "../../lib/goals";
import { useDeleteGoal, useSaveGoal } from "../../lib/queries";
import type { Goal, GoalPeriod } from "../../lib/types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { errorMessage, useToast } from "../ui/Toast";

const PERIODS: GoalPeriod[] = ["day", "week", "month"];

const SUGGESTED: Record<GoalPeriod, number[]> = {
  day: [1, 2, 3, 5],
  week: [5, 10, 15, 20],
  month: [20, 30, 40, 60],
};

const DEFAULT_TARGET: Record<GoalPeriod, number> = { day: 2, week: 5, month: 20 };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Editing an existing goal; omit to create one. */
  goal?: Goal;
  /** Periods that already have a goal (can't create a second). */
  usedPeriods: GoalPeriod[];
}

export function GoalModal(props: Props) {
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.goal ? `${PERIOD_ADJECTIVE[props.goal.period]} goal` : "Set an application goal"}
      description="We'll keep count from your applied dates and tell you when you're falling behind."
    >
      {props.open && <GoalForm key={props.goal?.id ?? "new"} {...props} />}
    </Modal>
  );
}

function GoalForm({ goal, usedPeriods, onClose }: Props) {
  const toast = useToast();
  const save = useSaveGoal();
  const remove = useDeleteGoal();
  const free = PERIODS.filter((p) => !usedPeriods.includes(p));
  const [period, setPeriod] = useState<GoalPeriod>(goal?.period ?? free[0] ?? "week");
  const [target, setTarget] = useState<number>(goal?.target ?? DEFAULT_TARGET[goal?.period ?? free[0] ?? "week"]);
  const [weekdaysOnly, setWeekdaysOnly] = useState(goal?.weekdays_only ?? true);

  const clamp = (n: number) => Math.max(1, Math.min(100, Math.round(n) || 1));

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate(
      { period, target: clamp(target), weekdays_only: period === "day" ? weekdaysOnly : true },
      {
        onSuccess: (saved) => {
          toast.success(goal ? "Goal updated" : `Goal set: ${goalSummary(saved)}`);
          onClose();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {!goal && (
        <div>
          <p className="mb-1.5 text-sm font-medium">How often</p>
          <div role="radiogroup" aria-label="How often" className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface-2 p-1">
            {PERIODS.map((p) => {
              const taken = usedPeriods.includes(p);
              const active = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={taken}
                  onClick={() => {
                    setPeriod(p);
                    setTarget(DEFAULT_TARGET[p]);
                  }}
                  title={taken ? `You already have a ${PERIOD_ADJECTIVE[p].toLowerCase()} goal` : undefined}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {PERIOD_ADJECTIVE[p]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="goal-target" className="mb-1.5 block text-sm font-medium">
          Applications per {PERIOD_NOUN[period]}
        </label>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" onClick={() => setTarget((t) => clamp(t - 1))} aria-label="Decrease">
            <Minus className="size-4" />
          </Button>
          <input
            id="goal-target"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            onBlur={() => setTarget((t) => clamp(t))}
            className="w-20 rounded-xl border border-line bg-surface py-1.5 text-center font-display text-4xl tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
          <Button variant="secondary" size="icon" onClick={() => setTarget((t) => clamp(t + 1))} aria-label="Increase">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTED[period].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTarget(n)}
              aria-pressed={target === n}
              className={`rounded-full border px-3 py-1 text-[13px] tabular-nums transition ${
                target === n ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {period === "day" && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5">
          <input
            type="checkbox"
            checked={weekdaysOnly}
            onChange={(e) => setWeekdaysOnly(e.target.checked)}
            className="mt-0.5 size-[18px] shrink-0 accent-[var(--accent)]"
          />
          <span>
            <span className="block text-sm font-medium">Weekdays only</span>
            <span className="block text-sm text-ink-3">Weekends don't count against you or break your streak.</span>
          </span>
        </label>
      )}

      <p className="rounded-xl bg-surface-2 px-3.5 py-3 text-sm text-ink-2">
        Goal: <strong className="font-medium text-ink">{goalSummary({ period, target: clamp(target), weekdays_only: weekdaysOnly })}</strong>.
        Only applications with a date applied count. Wishlist items don't.
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        {goal && (
          <Button
            variant="dangerGhost"
            className="sm:mr-auto"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(goal.id, {
                onSuccess: () => {
                  toast.success("Goal removed");
                  onClose();
                },
                onError: (err) => toast.error(errorMessage(err)),
              })
            }
          >
            <Trash2 className="size-4" aria-hidden /> Remove goal
          </Button>
        )}
        <Button variant="secondary" onClick={onClose} className={goal ? "" : "sm:ml-auto"}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {goal ? "Save goal" : "Set goal"}
        </Button>
      </div>
    </form>
  );
}
