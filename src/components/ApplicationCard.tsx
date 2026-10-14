import { Link } from "react-router";
import type { Application } from "../types";
import { StageBadge } from "./StageBadge";

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard = ({
  application,
}: ApplicationCardProps) => {
  const {
    id,
    company,
    role,
    link,
    dateSent,
    stage,
  } = application;

  // Parse the date as a local calendar date
  const [year, month, day] = dateSent.split("-").map(Number);
  const sentDate = new Date(year, month - 1, day);

  const formattedDate = sentDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Compare calendar dates to avoid timezone issues
  const today = new Date();

  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const sentUTC = Date.UTC(year, month - 1, day);

  const daysAgo = Math.max(
    0,
    Math.floor((todayUTC - sentUTC) / 86400000)
  );

  const needsFollowUp = stage === "applied" && daysAgo >= 14;

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:px-6">
      {/* Main card link */}
      <Link
        to={`/applications/${id}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        aria-label={`View ${role} application at ${company}`}
      />

      <div className="pointer-events-none relative flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Company icon */}
        <div className="flex items-center gap-4 sm:min-w-0 sm:flex-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-xl font-bold text-indigo-600">
            {company.charAt(0).toUpperCase()}
          </div>

          {/* Application details */}
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
              {role}
            </h3>

            <p className="mt-0.5 text-sm text-slate-500">
              {company}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{formattedDate}</span>
              <span>·</span>
              <span>
                {daysAgo === 0
                  ? "Today"
                  : `${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago`}
              </span>
            </div>
          </div>
        </div>

        {/* Status and follow-up */}
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <StageBadge stage={stage} />

          {needsFollowUp && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <span>♧</span>
              Follow up
            </span>
          )}

          {/* External job link */}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto relative z-10 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View Job ↗
            </a>
          )}

          <span className="hidden text-xl text-slate-400 transition-transform group-hover:translate-x-1 sm:block">
            ›
          </span>
        </div>
      </div>
    </div>
  );
};