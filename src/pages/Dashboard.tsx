import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarCheck2, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { displayName, useAuth } from "../auth/AuthProvider";
import { ApplicationCard } from "../components/ApplicationCard";
import { GoalNudge, GoalsPanel } from "../components/goals/GoalsPanel";
import { NextUpChip } from "../components/NextUpChip";
import { WeeklyChart } from "../components/WeeklyChart";
import { CompanyAvatar } from "../components/ui/CompanyAvatar";
import { EmptyState } from "../components/ui/EmptyState";
import { buttonClass, cardClass, eyebrowClass } from "../components/ui/styles";
import { buildAgenda, isOverdue, type AgendaItem } from "../lib/agenda";
import { ACTIVE_STATUSES, STATUS_META, STATUS_ORDER } from "../lib/constants";
import { companyName, roleTitle } from "../lib/display";
import { daysUntil, greeting } from "../lib/format";
import { useApplications } from "../lib/queries";
import { useChangeStatus } from "../lib/useChangeStatus";
import { ErrorPanel, PageSkeleton } from "./states";

export function Dashboard() {
  const { user } = useAuth();
  const { data: apps = [], isLoading, error, refetch } = useApplications();
  const { change } = useChangeStatus();
  const { hash } = useLocation();

  const stats = useMemo(() => {
    const sent = apps.filter((a) => a.status !== "wishlist");
    const progressed = sent.filter(
      (a) => ["screening", "interviewing", "offer"].includes(a.status) || a.stages.length > 0,
    );
    const agenda = buildAgenda(apps);
    return {
      active: apps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length,
      interviews: agenda.filter((i) => i.kind === "stage").length,
      dueThisWeek: agenda.filter((i) => i.kind !== "stage" && daysUntil(i.date) <= 7).length,
      responseRate: sent.length ? Math.round((progressed.length / sent.length) * 100) : null,
      sentCount: sent.length,
      agenda,
    };
  }, [apps]);

  // Goal badges link to /#goals.
  useEffect(() => {
    if (hash === "#goals" && !isLoading) document.getElementById("goals")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, isLoading]);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorPanel error={error} onRetry={refetch} />;

  const firstName = displayName(user).split(" ")[0];
  const recent = [...apps].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 4);

  return (
    <div className="space-y-8 animate-rise">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={eyebrowClass}>
            {new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
          </p>
          <h1 className="mt-2 font-display text-[40px] leading-[1.05] tracking-tight sm:text-5xl">
            {greeting()}, <em className="text-ink-2">{firstName}</em>
          </h1>
          <p className="mt-2 text-[15px] text-ink-2">
            {apps.length === 0
              ? "Let's log your first application."
              : stats.agenda.length > 0
                ? `You have ${stats.agenda.length} upcoming ${stats.agenda.length === 1 ? "item" : "items"} on your plate.`
                : "Nothing urgent. A good day to send a few more applications."}
          </p>
        </div>
        <Link to="/applications/new" className={buttonClass("primary", "md", "self-start sm:self-auto")}>
          <Plus className="size-4" aria-hidden />
          Add application
        </Link>
      </header>

      <GoalNudge />
      <GoalsPanel />

      {apps.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="Your shortlist is empty"
          description="Add a job you've applied for (or want to). Paste the link, attach the CV you used, and Shortlist will keep track of the dates for you."
          action={
            <Link to="/applications/new" className={buttonClass("primary")}>
              <Plus className="size-4" aria-hidden /> Add your first application
            </Link>
          }
        />
      ) : (
        <>
          {/* Stat tiles */}
          <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Active" value={stats.active} hint="in progress" to="/applications?status=active" highlight />
            <Stat label="Interviews" value={stats.interviews} hint="scheduled" />
            <Stat label="Due in 7 days" value={stats.dueThisWeek} hint="tasks & closing dates" />
            <Stat
              label="Response rate"
              value={stats.responseRate == null ? "—" : `${stats.responseRate}%`}
              hint={`of ${stats.sentCount} sent`}
            />
          </section>

          <Pipeline apps={apps} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
            <Agenda items={stats.agenda} />

            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="font-semibold">Applications sent</h2>
              <p className="text-sm text-ink-3">Per week, by date applied</p>
              <div className="mt-5">
                <WeeklyChart applications={apps} />
              </div>
            </section>
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recently updated</h2>
              <Link to="/applications" className="inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-ink">
                View all <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recent.map((a) => (
                <ApplicationCard key={a.id} application={a} onStatusChange={(s) => change(a, s)} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  to,
  highlight,
}: {
  label: string;
  value: number | string;
  hint: string;
  to?: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <p className={`text-xs font-medium ${highlight ? "text-[#14140f]/70" : "text-ink-3"}`}>{label}</p>
      <p className="mt-3 font-display text-[44px] leading-none tabular-nums tracking-tight">{value}</p>
      <p className={`mt-2 text-xs ${highlight ? "text-[#14140f]/70" : "text-ink-3"}`}>{hint}</p>
    </>
  );
  const cls = `block rounded-2xl border p-4 sm:p-5 transition ${
    highlight ? "border-transparent bg-lime text-[#14140f]" : "border-line bg-surface"
  }`;
  return to ? (
    <Link to={to} className={`${cls} hover:-translate-y-0.5`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Pipeline({ apps }: { apps: { status: (typeof STATUS_ORDER)[number] }[] }) {
  const counts = STATUS_ORDER.map((s) => ({ status: s, count: apps.filter((a) => a.status === s).length }));
  const total = apps.length;

  return (
    <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="pipeline-title">
      <div className="flex items-baseline justify-between">
        <h2 id="pipeline-title" className="font-semibold">
          Pipeline
        </h2>
        <span className="text-sm tabular-nums text-ink-3">{total} total</span>
      </div>

      <div className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full" aria-hidden>
        {counts
          .filter((c) => c.count > 0)
          .map((c) => (
            <div
              key={c.status}
              className={`${STATUS_META[c.status].dot} first:rounded-l-full last:rounded-r-full`}
              style={{ flexGrow: c.count }}
              title={`${STATUS_META[c.status].label}: ${c.count}`}
            />
          ))}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4 lg:grid-cols-7">
        {counts.map((c) => (
          <li key={c.status}>
            <Link
              to={`/applications?status=${c.status}`}
              className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-surface-2"
            >
              <span className={`size-2 rounded-full ${STATUS_META[c.status].dot}`} aria-hidden />
              <span className="text-ink-2">{STATUS_META[c.status].label}</span>
              <span className="ml-auto font-medium tabular-nums lg:ml-1">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function groupAgenda(items: AgendaItem[]) {
  const groups: { label: string; items: AgendaItem[] }[] = [
    { label: "Overdue", items: [] },
    { label: "Today", items: [] },
    { label: "Next 7 days", items: [] },
    { label: "Later", items: [] },
  ];
  for (const item of items) {
    const d = daysUntil(item.date);
    if (isOverdue(item)) groups[0].items.push(item);
    else if (d === 0) groups[1].items.push(item);
    else if (d <= 7) groups[2].items.push(item);
    else groups[3].items.push(item);
  }
  return groups.filter((g) => g.items.length > 0);
}

function Agenda({ items }: { items: AgendaItem[] }) {
  const groups = groupAgenda(items.slice(0, 12));
  return (
    <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="agenda-title">
      <h2 id="agenda-title" className="font-semibold">
        Coming up
      </h2>
      <p className="text-sm text-ink-3">Interviews, assignments and closing dates</p>

      {groups.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            compact
            icon={CalendarCheck2}
            title="All clear"
            description="Add interview rounds or assignments to an application and they'll show up here."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <h3 className={`${eyebrowClass} mb-2 ${g.label === "Overdue" ? "!text-danger" : ""}`}>{g.label}</h3>
              <ul className="divide-y divide-line">
                {g.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <CompanyAvatar name={companyName(item.application)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/applications/${item.application.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {roleTitle(item.application)} · <span className="text-ink-2">{companyName(item.application)}</span>
                      </Link>
                      <div className="mt-1">
                        <NextUpChip item={item} />
                      </div>
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass("ghost", "icon", "shrink-0")}
                        aria-label={`Open link for ${item.title}`}
                      >
                        <ArrowUpRight className="size-4" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

