import { BriefcaseBusiness, Columns3, List, Plus, Search, SearchX, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { ApplicationCard } from "../components/ApplicationCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Select } from "../components/ui/Field";
import { Pagination } from "../components/ui/Pagination";
import { buttonClass, eyebrowClass, inputClass } from "../components/ui/styles";
import { nextUp } from "../lib/agenda";
import { ACTIVE_STATUSES, STATUS_META, STATUS_ORDER } from "../lib/constants";
import { companyName } from "../lib/display";
import { useApplications } from "../lib/queries";
import type { ApplicationStatus, ApplicationWithRelations } from "../lib/types";
import { useChangeStatus } from "../lib/useChangeStatus";
import { ErrorPanel, PageSkeleton } from "./states";

type Filter = "all" | "active" | ApplicationStatus;
type Sort = "recent" | "applied" | "upcoming" | "company";

const PAGE_SIZE = 20;

const SORTS: { value: Sort; label: string }[] = [
  { value: "recent", label: "Recently updated" },
  { value: "applied", label: "Date applied" },
  { value: "upcoming", label: "Next deadline" },
  { value: "company", label: "Company A–Z" },
];

function sortApps(apps: ApplicationWithRelations[], sort: Sort) {
  const list = [...apps];
  switch (sort) {
    case "recent":
      return list.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    case "applied":
      return list.sort((a, b) => (b.applied_on ?? "").localeCompare(a.applied_on ?? ""));
    case "company":
      return list.sort((a, b) => companyName(a).localeCompare(companyName(b), undefined, { sensitivity: "base" }));
    case "upcoming": {
      const key = (a: ApplicationWithRelations) => nextUp(a)?.date.getTime() ?? Number.POSITIVE_INFINITY;
      return list.sort((a, b) => key(a) - key(b));
    }
  }
}

export function Applications() {
  const { data: apps = [], isLoading, error, refetch } = useApplications();
  const { change } = useChangeStatus();
  const [params, setParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const filter = (params.get("status") as Filter) || "all";
  const query = params.get("q") ?? "";
  const sort = (params.get("sort") as Sort) || "recent";
  const view = params.get("view") === "board" ? "board" : "list";

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    // A new search, filter or sort starts again from the first page.
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  }

  function goToPage(p: number) {
    const next = new URLSearchParams(params);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    // Pages are history entries, so Back returns to the previous page.
    setParams(next);
    window.scrollTo({ top: 0 });
  }

  // "/" focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || el.closest("input, textarea, select, dialog")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length, active: 0 };
    for (const s of STATUS_ORDER) c[s] = 0;
    for (const a of apps) {
      c[a.status]++;
      if (ACTIVE_STATUSES.includes(a.status)) c.active++;
    }
    return c;
  }, [apps]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = apps.filter((a) => {
      const statusOk =
        filter === "all" || (filter === "active" ? ACTIVE_STATUSES.includes(a.status) : a.status === filter);
      if (!statusOk) return false;
      if (!q) return true;
      return [a.company, a.role, a.job_url, a.location, a.source, a.notes]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
    return sortApps(filtered, sort);
  }, [apps, filter, query, sort]);

  if (isLoading) return <PageSkeleton rows={5} />;
  if (error) return <ErrorPanel error={error} onRetry={refetch} />;

  const filters: Filter[] = ["all", "active", ...STATUS_ORDER];

  // Clamped, so a stale ?page= (or the last item moving to another status) never shows an empty page.
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageApps = visible.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="animate-rise">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={eyebrowClass}>Your search</p>
          <h1 className="mt-2 font-display text-[40px] leading-none tracking-tight sm:text-5xl">Applications</h1>
        </div>
        <Link to="/applications/new" className={buttonClass("primary", "md", "hidden self-start sm:inline-flex sm:self-auto")}>
          <Plus className="size-4" aria-hidden /> Add application
        </Link>
      </header>

      {apps.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={BriefcaseBusiness}
            title="No applications yet"
            description="Every job you apply for lives here, with its CV, dates, interviews and assignments."
            action={
              <Link to="/applications/new" className={buttonClass("primary")}>
                <Plus className="size-4" aria-hidden /> Add application
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="sticky top-[61px] z-20 -mx-4 mt-6 border-b border-line bg-bg/90 px-4 pb-3 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setParam("q", e.target.value || null)}
                  placeholder="Search company, role, location…"
                  aria-label="Search applications"
                  className={`${inputClass} pl-10 pr-10`}
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setParam("q", null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-3 hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] text-ink-3 md:block">
                    /
                  </kbd>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 md:w-48 md:flex-none">
                  <Select value={sort} onChange={(e) => setParam("sort", e.target.value === "recent" ? null : e.target.value)} aria-label="Sort by">
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex rounded-xl border border-line bg-surface-2 p-1" role="group" aria-label="View">
                  {(
                    [
                      ["list", List, "List view"],
                      ["board", Columns3, "Board view"],
                    ] as const
                  ).map(([v, Icon, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setParam("view", v === "list" ? null : v)}
                      aria-pressed={view === v}
                      aria-label={label}
                      title={label}
                      className={`rounded-lg px-2.5 transition ${
                        view === v ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-3 hover:text-ink"
                      }`}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {view === "list" && (
              <div className="scrollbar-none -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by status">
                {filters.map((f) => {
                  const active = filter === f;
                  const label = f === "all" ? "All" : f === "active" ? "Active" : STATUS_META[f].label;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setParam("status", f === "all" ? null : f)}
                      aria-pressed={active}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
                        active
                          ? "border-ink bg-ink text-bg"
                          : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {f !== "all" && f !== "active" && (
                        <span className={`size-1.5 rounded-full ${STATUS_META[f].dot}`} aria-hidden />
                      )}
                      {label}
                      <span className={`tabular-nums ${active ? "opacity-70" : "text-ink-3"}`}>{counts[f]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-ink-3" aria-live="polite">
            {view === "list" && pages > 1 && (
              <>
                Showing {pageStart + 1}–{pageStart + pageApps.length} of{" "}
              </>
            )}
            {visible.length} {visible.length === 1 ? "application" : "applications"}
            {query && <> matching “{query}”</>}
          </p>

          {view === "list" ? (
            visible.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={SearchX}
                  title="Nothing matches"
                  description="Try a different search or status filter."
                  action={
                    <button type="button" className={buttonClass("secondary")} onClick={() => setParams({}, { replace: true })}>
                      Clear filters
                    </button>
                  }
                />
              </div>
            ) : (
              <>
                <ul className="mt-4 grid grid-cols-1 gap-3">
                  {pageApps.map((a) => (
                    <li key={a.id}>
                      <ApplicationCard application={a} onStatusChange={(s) => change(a, s)} />
                    </li>
                  ))}
                </ul>
                <Pagination page={page} pages={pages} onChange={goToPage} className="mt-6" />
              </>
            )
          ) : (
            <Board apps={visible} onStatusChange={change} />
          )}
        </>
      )}
    </div>
  );
}

function Board({
  apps,
  onStatusChange,
}: {
  apps: ApplicationWithRelations[];
  onStatusChange: (app: ApplicationWithRelations, s: ApplicationStatus) => void;
}) {
  return (
    <div className="scrollbar-none -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      {STATUS_ORDER.map((status) => {
        const col = apps.filter((a) => a.status === status);
        return (
          <section
            key={status}
            aria-label={STATUS_META[status].label}
            className="flex w-[280px] shrink-0 snap-start flex-col rounded-2xl bg-surface-2/70 p-2"
          >
            <header className="flex items-center gap-2 px-2 py-2">
              <span className={`size-2 rounded-full ${STATUS_META[status].dot}`} aria-hidden />
              <h2 className="text-sm font-semibold">{STATUS_META[status].label}</h2>
              <span className="ml-auto text-xs tabular-nums text-ink-3">{col.length}</span>
            </header>
            <div className="flex flex-col gap-2">
              {col.map((a) => (
                <ApplicationCard key={a.id} application={a} compact onStatusChange={(s) => onStatusChange(a, s)} />
              ))}
              {col.length === 0 && (
                <p className="rounded-xl border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-3">
                  {STATUS_META[status].description}
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
