import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { SkillStat } from "../../lib/skills/extract";
import type { UserSkill } from "../../lib/types";
import { cardClass } from "../ui/styles";

const PLOT_HEIGHT = 240;
const PAD = { top: 12, right: 12, bottom: 40, left: 44 };
const MAX_POINTS = 40;
const DOT = 5;
/** Pointer distance (px) that still counts as hovering a dot. */
const HIT = 24;
/** Skills sharing exact coordinates are nudged by up to this many px so they don't hide each other. */
const JITTER = 5;

interface Point {
  stat: SkillStat;
  have: boolean;
  /** Share of analysed jobs that mention the skill, 0–1. */
  share: number;
  /** Of those jobs, the share that list it as required, 0–1. */
  requiredShare: number;
  x: number;
  y: number;
}

/** Stable pseudo-random offset in [-1, 1] from a string. */
function wobble(id: string, salt: number) {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 1000) + 1000) % 1000 / 500 - 1;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Scatter of how often each skill comes up (x) against how often it's a hard
 * requirement when it does (y). Gaps in the top-right are the ones worth learning.
 */
export function SkillMap({
  stats,
  mine,
  analysed,
  onSelect,
}: {
  stats: SkillStat[];
  mine: Map<string, UserSkill>;
  analysed: number;
  onSelect: (id: string) => void;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const tapped = useRef(false);

  // With a handful of jobs every skill is in at least one, so one-offs only add noise.
  const minJobs = analysed >= 5 ? 2 : 1;
  const plotted = useMemo(() => stats.filter((s) => s.jobs >= minJobs).slice(0, MAX_POINTS), [stats, minJobs]);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const maxShare = Math.max(0.2, ...plotted.map((s) => s.jobs / analysed));
  const xMax = Math.min(1, Math.ceil(maxShare * 10) / 10);
  const sx = (v: number) => PAD.left + (v / xMax) * plotW;
  const sy = (v: number) => PAD.top + (1 - v) * PLOT_HEIGHT;

  const points = useMemo<Point[]>(
    () =>
      plotted.map((stat) => {
        const share = stat.jobs / analysed;
        const requiredShare = stat.required / stat.jobs;
        return {
          stat,
          have: mine.has(stat.id),
          share,
          requiredShare,
          x: clamp(PAD.left + (share / xMax) * plotW + wobble(stat.id, 7) * JITTER, PAD.left, PAD.left + plotW),
          y: clamp(PAD.top + (1 - requiredShare) * PLOT_HEIGHT + wobble(stat.id, 13) * JITTER, PAD.top, PAD.top + PLOT_HEIGHT),
        };
      }),
    [plotted, mine, analysed, xMax, plotW],
  );

  // Same ordering as "Biggest gaps": most often required first.
  const gaps = useMemo(
    () => points.filter((p) => !p.have).sort((a, b) => b.stat.required - a.stat.required || b.stat.jobs - a.stat.jobs),
    [points],
  );

  // Name the top gaps directly, skipping any label that would collide with one already placed.
  const labels = useMemo(() => {
    const placed: { x: number; y: number; w: number; text: string; anchor: "start" | "end" }[] = [];
    const max = width < 480 ? 3 : 5;
    for (const p of gaps) {
      if (placed.length >= max) break;
      const w = p.stat.label.length * 6.2;
      const right = p.x + DOT + 6 + w <= PAD.left + plotW;
      const x = right ? p.x + DOT + 6 : p.x - DOT - 6;
      const left = right ? x : x - w;
      const clash = placed.some((l) => {
        const lLeft = l.anchor === "start" ? l.x : l.x - l.w;
        return Math.abs(l.y - p.y) < 14 && left < lLeft + l.w + 4 && lLeft < left + w + 4;
      });
      if (!clash) placed.push({ x, y: p.y, w, text: p.stat.label, anchor: right ? "start" : "end" });
    }
    return placed;
  }, [gaps, width, plotW]);

  // Keyboard order: left to right, so arrow keys move the way the eye reads the chart.
  const order = useMemo(() => points.map((_, i) => i).sort((a, b) => points[a].x - points[b].x), [points]);

  if (plotted.length < 3) return null;

  function nearest(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    let best: number | null = null;
    let bestD = HIT;
    points.forEach((p, i) => {
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    const at = active == null ? -1 : order.indexOf(active);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActive(order[(at + 1) % order.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive(order[(at - 1 + order.length) % order.length]);
    } else if ((e.key === "Enter" || e.key === " ") && active != null) {
      e.preventDefault();
      onSelect(points[active].stat.id);
    } else if (e.key === "Escape") {
      setActive(null);
    }
  }

  const current = active == null ? null : points[active];
  const xTicks = [0, xMax / 2, xMax];
  const yTicks = [0, 0.5, 1];
  const plotRight = PAD.left + plotW;
  const height = PAD.top + PLOT_HEIGHT + PAD.bottom;
  // Draw haves first so gaps, the point of the chart, sit on top; the hovered dot goes last.
  const drawOrder = points
    .map((p, i) => ({ p, i }))
    .sort((a, b) => Number(a.i === active) - Number(b.i === active) || Number(!a.p.have) - Number(!b.p.have));

  return (
    <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="skill-map-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="skill-map-title" className="font-semibold">
            What to learn next
          </h2>
          <p className="text-sm text-ink-3">
            Gaps in the top right come up often and are usually required.
            {minJobs > 1 && " Skills in at least 2 of your jobs."}
          </p>
        </div>
        <ul className="flex shrink-0 items-center gap-4 text-xs text-ink-2 sm:pt-1" aria-label="Legend">
          <li className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-chart-have" aria-hidden />
            You have
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="mx-px size-2 rotate-45 bg-chart-gap" aria-hidden />
            Gap
          </li>
        </ul>
      </div>

      <div ref={wrapRef} className="relative mt-4">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className={`block touch-manipulation rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent ${current ? "cursor-pointer" : ""}`}
            tabIndex={0}
            role="group"
            aria-label={`Skill map: ${points.length} skills by how often they appear and how often they're required. Use the arrow keys to move between skills and Enter to see one in the list.`}
            aria-describedby="skill-map-summary"
            onPointerMove={(e) => e.pointerType === "mouse" && setActive(nearest(e))}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse") return;
              // On touch, the first tap shows the details and a second tap on the same dot opens it.
              const hit = nearest(e);
              tapped.current = hit != null && hit !== active;
              setActive(hit);
            }}
            onClick={() => {
              if (tapped.current) {
                tapped.current = false;
                return;
              }
              if (current) onSelect(current.stat.id);
            }}
            onFocus={() => active == null && setActive(order[order.length - 1])}
            onBlur={() => setActive(null)}
            onKeyDown={onKeyDown}
          >
            {/* Top-right quadrant: frequent and usually required. */}
            <rect
              x={sx(xMax / 2)}
              y={sy(1)}
              width={plotRight - sx(xMax / 2)}
              height={PLOT_HEIGHT / 2}
              className="fill-chart-gap"
              opacity={0.07}
            />
            <text
              x={plotRight - 6}
              y={sy(1) + 14}
              textAnchor="end"
              className="fill-ink-2 text-[10px] font-semibold tracking-wider uppercase"
            >
              Learn next
            </text>

            {xTicks.map((t) => (
              <g key={`x${t}`}>
                <line x1={sx(t)} x2={sx(t)} y1={sy(1)} y2={sy(0)} className="stroke-line" strokeWidth={1} />
                <text
                  x={sx(t)}
                  y={sy(0) + 16}
                  textAnchor={t === 0 ? "start" : t === xMax ? "end" : "middle"}
                  className="fill-ink-3 text-[11px] tabular-nums"
                >
                  {pct(t)}
                </text>
              </g>
            ))}
            {yTicks.map((t) => (
              <g key={`y${t}`}>
                <line x1={PAD.left} x2={plotRight} y1={sy(t)} y2={sy(t)} className="stroke-line" strokeWidth={1} />
                <text x={PAD.left - 8} y={sy(t) + 4} textAnchor="end" className="fill-ink-3 text-[11px] tabular-nums">
                  {pct(t)}
                </text>
              </g>
            ))}
            <text x={(PAD.left + plotRight) / 2} y={height - 4} textAnchor="middle" className="fill-ink-3 text-[11px]">
              Share of your jobs that mention it →
            </text>
            <text
              transform={`translate(11 ${sy(0.5)}) rotate(-90)`}
              textAnchor="middle"
              className="fill-ink-3 text-[11px]"
            >
              How often it's required →
            </text>

            {drawOrder.map(({ p, i }) => {
              const r = i === active ? DOT + 2 : DOT;
              // Gaps are diamonds as well as orange, so they stand apart without relying on colour.
              const diamond = (d: number) => `${p.x},${p.y - d} ${p.x + d},${p.y} ${p.x},${p.y + d} ${p.x - d},${p.y}`;
              const d = r * 1.3;
              return (
                <g key={p.stat.id}>
                  {p.have ? (
                    <>
                      <circle cx={p.x} cy={p.y} r={r + 2} className="fill-surface" />
                      <circle cx={p.x} cy={p.y} r={r} className="fill-chart-have" />
                    </>
                  ) : (
                    <>
                      <polygon points={diamond(d + 2.5)} className="fill-surface" />
                      <polygon points={diamond(d)} className="fill-chart-gap" />
                    </>
                  )}
                  {i === active && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r + 6}
                      className={`fill-none ${p.have ? "stroke-chart-have" : "stroke-chart-gap"}`}
                      strokeWidth={1.5}
                      opacity={0.6}
                    />
                  )}
                </g>
              );
            })}

            {labels.map((l) => (
              <text
                key={l.text}
                x={l.x}
                y={l.y + 4}
                textAnchor={l.anchor}
                className="pointer-events-none fill-ink-2 text-[11px] font-medium"
              >
                {l.text}
              </text>
            ))}
          </svg>
        )}

        {current && (
          <div
            className="pointer-events-none absolute z-10 w-56 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-lg"
            style={{
              left: current.x > width / 2 ? current.x - 224 - 14 : current.x + 14,
              top: Math.max(0, Math.min(current.y - 40, PAD.top + PLOT_HEIGHT - 90)),
            }}
          >
            <p className="text-sm font-semibold text-ink">{current.stat.label}</p>
            <p className="mt-1 text-ink-2 tabular-nums">
              In {current.stat.jobs} of {analysed} jobs · {pct(current.share)}
            </p>
            <p className="text-ink-2 tabular-nums">
              Required in {current.stat.required} of those · {pct(current.requiredShare)}
            </p>
            <p className="mt-1.5 font-medium text-ink">{current.have ? "In your skills" : "Not in your skills yet"}</p>
            <p className="mt-1 text-ink-3">Select to see the jobs</p>
          </div>
        )}
      </div>

      <p id="skill-map-summary" className="sr-only">
        {gaps.length
          ? `Biggest gaps: ${gaps
              .slice(0, 5)
              .map((g) => `${g.stat.label}, in ${pct(g.share)} of jobs and required in ${pct(g.requiredShare)} of those`)
              .join("; ")}.`
          : "You have every skill shown."}
      </p>
      <p className="sr-only" aria-live="polite">
        {current
          ? `${current.stat.label}: in ${pct(current.share)} of jobs, required in ${pct(current.requiredShare)}. ${current.have ? "You have it." : "Gap."}`
          : ""}
      </p>
    </section>
  );
}
