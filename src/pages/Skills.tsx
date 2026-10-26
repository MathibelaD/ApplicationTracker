import { ChevronDown, Info, ScanText } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { MySkillsEditor } from "../components/skills/MySkillsEditor";
import { HaveToggle, TierLegend } from "../components/skills/SkillBits";
import { EmptyState } from "../components/ui/EmptyState";
import { Segmented, Select } from "../components/ui/Field";
import { buttonClass, cardClass, eyebrowClass } from "../components/ui/styles";
import { companyName, roleTitle } from "../lib/display";
import { useApplications, useUserSkills } from "../lib/queries";
import { CATEGORY_LABEL, type SkillCategory } from "../lib/skills/catalog";
import type { SkillStat } from "../lib/skills/extract";
import { TIER_LABEL, TIER_SWATCH } from "../lib/skills/tiers";
import { RELIABLE_SAMPLE, useSkillInsights, type SkillScope } from "../lib/skills/useSkillInsights";
import { useToggleSkill } from "../lib/skills/useToggleSkill";
import type { UserSkill } from "../lib/types";
import { ErrorPanel, PageSkeleton } from "./states";

type View = "all" | "gaps" | "have";

const PAGE = 20;
const TOP = 10;

function categoryLabel(c: SkillCategory | "custom") {
  return c === "custom" ? "Your own" : CATEGORY_LABEL[c];
}

export function Skills() {
  const [scope, setScope] = useState<SkillScope>("all");
  const { data, isLoading, error, refetch } = useSkillInsights(scope);
  const { data: mySkills = [] } = useUserSkills();

  if (isLoading || !data) return error ? <ErrorPanel error={error} onRetry={refetch} /> : <PageSkeleton rows={5} />;

  const { analysis, mine, withoutDescription } = data;
  const n = analysis.analysed;

  return (
    <div className="animate-rise">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={eyebrowClass}>Insights</p>
          <h1 className="mt-2 font-display text-[40px] leading-none tracking-tight sm:text-5xl">Skills</h1>
          <p className="mt-3 max-w-xl text-[15px] text-ink-2">
            {n === 0
              ? "What the jobs you save keep asking for, read from their job descriptions."
              : `What your jobs keep asking for, read from ${n} job ${n === 1 ? "description" : "descriptions"}.`}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Segmented
            label="Which applications"
            value={scope}
            onChange={(v) => v && setScope(v)}
            options={[
              { value: "all", label: "All jobs" },
              { value: "open", label: "Open only" },
            ]}
          />
        </div>
      </header>

      {(n > 0 && n < RELIABLE_SAMPLE) || withoutDescription > 0 ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-line bg-surface-2/60 p-4 text-sm text-ink-2">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <p>
            {n > 0 && n < RELIABLE_SAMPLE && (
              <>
                Only {n} {n === 1 ? "description" : "descriptions"} so far. Patterns get reliable at around{" "}
                {RELIABLE_SAMPLE}–10.{" "}
              </>
            )}
            {withoutDescription > 0 && (
              <>
                {withoutDescription} {withoutDescription === 1 ? "application has" : "applications have"} no job
                description and {withoutDescription === 1 ? "isn't" : "aren't"} counted.{" "}
                <Link to="/applications" className="font-medium text-ink underline underline-offset-4">
                  Paste them in
                </Link>{" "}
                to improve this.
              </>
            )}
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {n === 0 ? (
            <EmptyState
              icon={ScanText}
              title="No job descriptions to read yet"
              description="Skills come from the job description on each application. Paste the ad text into a few applications and the patterns will show up here."
              action={
                <Link to="/applications" className={buttonClass("secondary")}>
                  Go to applications
                </Link>
              }
            />
          ) : (
            <>
              <div className="lg:hidden">
                <Coverage stats={analysis.stats} mine={mine} analysed={n} />
              </div>
              <RankedList stats={analysis.stats} mine={mine} analysed={n} />
            </>
          )}
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-10">
          {n > 0 && (
            <div className="hidden lg:block">
              <Coverage stats={analysis.stats} mine={mine} analysed={n} />
            </div>
          )}
          <MySkillsEditor skills={mySkills} />
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Coverage({ stats, mine, analysed }: { stats: SkillStat[]; mine: Map<string, UserSkill>; analysed: number }) {
  const toggle = useToggleSkill();
  const top = stats.slice(0, TOP);
  const covered = top.filter((s) => mine.has(s.id)).length;
  const gaps = stats
    .filter((s) => !mine.has(s.id))
    .sort((a, b) => b.required - a.required || b.jobs - a.jobs)
    .slice(0, 5);

  return (
    <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="coverage-title">
      <h2 id="coverage-title" className="font-semibold">
        Your coverage
      </h2>
      <p className="mt-1 text-sm text-ink-3">Of the {top.length} most-requested skills</p>

      <p className="mt-4 font-display text-[52px] leading-none tracking-tight tabular-nums">
        {covered}
        <span className="text-ink-3">/{top.length}</span>
      </p>
      <div className="mt-4 flex gap-[3px]" role="img" aria-label={`You have ${covered} of the top ${top.length} skills`}>
        {top.map((s) => (
          <span
            key={s.id}
            title={`${s.label}${mine.has(s.id) ? " · you have this" : ""}`}
            className={`h-2 flex-1 rounded-full ${mine.has(s.id) ? "bg-tier-required" : "bg-surface-2 ring-1 ring-inset ring-line"}`}
          />
        ))}
      </div>

      <h3 className={`${eyebrowClass} mt-6`}>Biggest gaps</h3>
      {gaps.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">You have every skill these jobs mention. Nice.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {gaps.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.label}</p>
                <p className="text-xs text-ink-3">
                  {s.required > 0 ? `Required in ${s.required} · ` : ""}in {s.jobs} of {analysed} jobs
                </p>
              </div>
              <HaveToggle label={s.label} have={false} onToggle={() => toggle(s.label, undefined)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

function RankedList({ stats, mine, analysed }: { stats: SkillStat[]; mine: Map<string, UserSkill>; analysed: number }) {
  const toggle = useToggleSkill();
  const { data: apps = [] } = useApplications();
  const [view, setView] = useState<View>("all");
  const [category, setCategory] = useState<SkillCategory | "custom" | "">("");
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);

  const appsById = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const categories = useMemo(() => [...new Set(stats.map((s) => s.category))], [stats]);

  const counts = {
    all: stats.length,
    gaps: stats.filter((s) => !mine.has(s.id)).length,
    have: stats.filter((s) => mine.has(s.id)).length,
  };

  const filtered = stats.filter(
    (s) =>
      (view === "all" || (view === "gaps" ? !mine.has(s.id) : mine.has(s.id))) && (!category || s.category === category),
  );
  const visible = filtered.slice(0, limit);

  return (
    <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="ranked-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="ranked-title" className="font-semibold">
            Most requested
          </h2>
          <p className="text-sm text-ink-3">Share of your jobs that mention each skill</p>
        </div>
        <TierLegend className="sm:justify-end sm:pt-1" />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-xl border border-line bg-surface-2 p-1" role="group" aria-label="Show">
          {(
            [
              ["all", "All"],
              ["gaps", "Gaps"],
              ["have", "You have"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                setLimit(PAGE);
              }}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition sm:flex-none ${
                view === v ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-2 hover:text-ink"
              }`}
            >
              {label} <span className="tabular-nums text-ink-3">{counts[v]}</span>
            </button>
          ))}
        </div>
        <div className="sm:ml-auto sm:w-48">
          <Select
            aria-label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as SkillCategory | "custom" | "");
              setLimit(PAGE);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-ink-2">
          {view === "have" ? "None of your skills appear in these jobs yet." : "Nothing to show for this filter."}
        </p>
      ) : (
        <ol className="mt-5 space-y-1">
          {visible.map((s) => {
            const rank = stats.indexOf(s) + 1;
            const pct = Math.round((s.jobs / analysed) * 100);
            const expanded = open === s.id;
            return (
              <li key={s.id} className="-mx-2 rounded-xl px-2 py-2.5 transition hover:bg-surface-2/60">
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-3">{rank}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium">
                        {s.label}
                        <span className="ml-2 text-xs font-normal text-ink-3 max-sm:hidden">{categoryLabel(s.category)}</span>
                      </p>
                      <p className="shrink-0 text-xs tabular-nums text-ink-2">
                        <span className="font-semibold text-ink">{s.jobs}</span> of {analysed} · {pct}%
                      </p>
                    </div>
                    <TierBar stat={s} analysed={analysed} />
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : s.id)}
                      aria-expanded={expanded}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink"
                    >
                      {[
                        s.required && `${s.required} required`,
                        s.mentioned && `${s.mentioned} mentioned`,
                        s.nice && `${s.nice} nice to have`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      <ChevronDown className={`size-3.5 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                  </div>
                  <HaveToggle label={s.label} have={mine.has(s.id)} onToggle={() => toggle(s.label, mine.get(s.id))} />
                </div>

                {expanded && (
                  <ul className="mt-2 ml-9 space-y-1 border-l border-line pl-3">
                    {s.applications.map(({ id, tier }) => {
                      const app = appsById.get(id);
                      if (!app) return null;
                      return (
                        <li key={id} className="flex items-center gap-2 text-sm">
                          <span className={`size-2 shrink-0 rounded-[3px] ${TIER_SWATCH[tier]}`} title={TIER_LABEL[tier]} aria-hidden />
                          <Link to={`/applications/${id}`} className="min-w-0 truncate text-ink-2 hover:text-ink hover:underline">
                            {roleTitle(app)} · {companyName(app)}
                          </Link>
                          <span className="ml-auto shrink-0 text-xs text-ink-3">{TIER_LABEL[tier]}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className={buttonClass("secondary", "sm", "mt-4 w-full")}
        >
          Show more ({filtered.length - limit} left)
        </button>
      )}
    </section>
  );
}

/** Stacked bar: segment widths are shares of all analysed jobs, strongest tier first. */
function TierBar({ stat, analysed }: { stat: SkillStat; analysed: number }) {
  const parts = (["required", "mentioned", "nice"] as const).filter((t) => stat[t] > 0);
  return (
    <div
      className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-surface-2"
      role="img"
      aria-label={`${stat.label}: ${parts.map((t) => `${stat[t]} ${TIER_LABEL[t].toLowerCase()}`).join(", ")} of ${analysed} jobs`}
    >
      <div className="flex h-full gap-[2px]" style={{ width: `${(stat.jobs / analysed) * 100}%` }}>
        {parts.map((t, i) => (
          <span
            key={t}
            title={`${TIER_LABEL[t]}: ${stat[t]} of ${analysed} jobs`}
            className={`h-full ${TIER_SWATCH[t]} ${i === parts.length - 1 ? "rounded-r-[4px]" : ""}`}
            style={{ flexGrow: stat[t], flexBasis: 0 }}
          />
        ))}
      </div>
    </div>
  );
}
