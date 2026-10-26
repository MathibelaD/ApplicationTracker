import { useMemo, useState } from "react";
import { formatDateCompact, parseDateOnly } from "../lib/format";
import type { Application } from "../lib/types";

const WEEKS = 10;

function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

/** Applications sent per week, last ten weeks. Single series, so no legend. */
export function WeeklyChart({ applications }: { applications: Application[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const weeks = useMemo(() => {
    const thisWeek = startOfWeek(new Date());
    const buckets = Array.from({ length: WEEKS }, (_, i) => {
      const start = new Date(thisWeek);
      start.setDate(start.getDate() - (WEEKS - 1 - i) * 7);
      return { start, count: 0 };
    });
    for (const a of applications) {
      if (!a.applied_on) continue;
      const w = startOfWeek(parseDateOnly(a.applied_on)).getTime();
      const b = buckets.find((x) => x.start.getTime() === w);
      if (b) b.count++;
    }
    return buckets;
  }, [applications]);

  const max = Math.max(1, ...weeks.map((w) => w.count));
  const total = weeks.reduce((s, w) => s + w.count, 0);
  const active = hover ?? WEEKS - 1;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink-2">
          <span className="font-semibold tabular-nums text-ink">{weeks[active].count}</span>{" "}
          {weeks[active].count === 1 ? "application" : "applications"} · week of {formatDateCompact(weeks[active].start)}
        </p>
        <p className="text-xs tabular-nums text-ink-3">{total} in {WEEKS} weeks</p>
      </div>

      <div
        className="relative mt-4 flex h-28 items-end gap-1.5 border-b border-line"
        role="img"
        aria-label={`Applications per week for the last ${WEEKS} weeks: ${weeks.map((w) => w.count).join(", ")}`}
        onMouseLeave={() => setHover(null)}
      >
        {weeks.map((w, i) => {
          const h = w.count === 0 ? 0 : Math.max(6, (w.count / max) * 100);
          return (
            <button
              key={w.start.toISOString()}
              type="button"
              tabIndex={-1}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              className="group flex h-full flex-1 cursor-default items-end"
              aria-label={`Week of ${formatDateCompact(w.start)}: ${w.count}`}
            >
              <span
                className={`w-full rounded-t-[4px] transition-[height,opacity] duration-300 ${
                  i === active ? "bg-chart" : "bg-chart/35 group-hover:bg-chart/60"
                }`}
                style={{ height: `${h}%` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
        <span>{formatDateCompact(weeks[0].start)}</span>
        <span>This week</span>
      </div>
    </div>
  );
}
