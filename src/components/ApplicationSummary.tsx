import type { Application, Stage } from "../types";
import type { StageFilter } from "./ApplicationList";

type ApplicationSummaryProps = {
  applications: Application[];
  selectedStage: StageFilter;
  onStageChange: (stage: StageFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

const stages: {
  stage: Stage;
  icon: string;
  color: string;
  iconColor: string;
}[] = [
  {
    stage: "wishlist",
    icon: "♡",
    color: "bg-slate-50",
    iconColor: "bg-slate-200 text-slate-700",
  },
  {
    stage: "applied",
    icon: "▤",
    color: "bg-blue-50",
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    stage: "interview",
    icon: "♧",
    color: "bg-amber-50",
    iconColor: "bg-amber-100 text-amber-600",
  },
  {
    stage: "offer",
    icon: "★",
    color: "bg-emerald-50",
    iconColor: "bg-emerald-100 text-emerald-600",
  },
  {
    stage: "closed",
    icon: "×",
    color: "bg-rose-50",
    iconColor: "bg-rose-100 text-rose-600",
  },
];

export const ApplicationSummary = ({
  applications,
  selectedStage,
  onStageChange,
  search,
  onSearchChange,
}: ApplicationSummaryProps) => {
  return (
    <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50 p-5 shadow-sm sm:p-8">
      {/* Heading */}
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
          Track your progress
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Your Applications
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Keep track of your job search and never miss a follow-up.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {stages.map(({ stage, icon, color, iconColor }) => {
          const count = applications.filter(
            (application) => application.stage === stage
          ).length;

          return (
            <button
              key={stage}
              type="button"
              onClick={() => onStageChange(stage)}
              className={`group flex items-center gap-3 rounded-2xl border border-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${color} ${
                selectedStage === stage
                  ? "ring-2 ring-indigo-400"
                  : ""
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${iconColor}`}
              >
                {icon}
              </div>

              <div>
                <p className="text-xs font-semibold capitalize text-slate-600">
                  {stage}
                </p>

                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {count}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and filter bar */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
            ⌕
          </span>

          <input
            type="search"
            aria-label="Search applications"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company or role..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", ...stages.map((item) => item.stage)] as StageFilter[]).map(
            (stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => onStageChange(stage)}
                aria-pressed={selectedStage === stage}
                className={`rounded-full px-4 py-2.5 text-xs font-semibold capitalize transition-all ${
                  selectedStage === stage
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                {stage}
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
};