import { ArrowUpRight, FileText, Image, MapPin } from "lucide-react";
import { Link } from "react-router";
import { nextUp } from "../lib/agenda";
import { WORK_MODE_LABEL } from "../lib/constants";
import { companyName, needsDetails, roleTitle } from "../lib/display";
import { formatDateCompact, hostname, relativeDay } from "../lib/format";
import type { ApplicationStatus, ApplicationWithRelations } from "../lib/types";
import { NextUpChip } from "./NextUpChip";
import { CompanyAvatar } from "./ui/CompanyAvatar";
import { StatusSelect } from "./ui/Status";

interface Props {
  application: ApplicationWithRelations;
  onStatusChange: (status: ApplicationStatus) => void;
  compact?: boolean;
}

export function ApplicationCard({ application: app, onStatusChange, compact }: Props) {
  const next = nextUp(app);
  const company = companyName(app);
  const role = roleTitle(app);
  const incomplete = needsDetails(app);
  const place = [app.location, app.work_mode && WORK_MODE_LABEL[app.work_mode]].filter(Boolean).join(" · ");

  return (
    <article
      className={`group relative rounded-2xl border border-line bg-surface transition hover:border-line-strong hover:shadow-[0_6px_24px_-12px_rgb(0_0_0/0.18)] ${
        compact ? "p-3.5" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex gap-3.5 sm:gap-4">
        <CompanyAvatar name={company} size={compact ? "sm" : "md"} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`truncate font-semibold text-ink ${compact ? "text-sm" : "text-[15px]"}`}>
                <Link
                  to={`/applications/${app.id}`}
                  className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-accent"
                >
                  {role}
                </Link>
              </h3>
              <p className="mt-0.5 truncate text-sm text-ink-2">{company}</p>
            </div>
            {!compact && (
              <div className="relative z-10 shrink-0">
                <StatusSelect value={app.status} onChange={onStatusChange} label={`Status for ${role} at ${company}`} />
              </div>
            )}
          </div>

          {!compact && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-3">
              {place && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {place}
                </span>
              )}
              <span>
                {app.applied_on ? (
                  <>
                    Applied <time dateTime={app.applied_on}>{formatDateCompact(app.applied_on)}</time>
                    <span className="text-ink-3/80"> · {relativeDay(app.applied_on)}</span>
                  </>
                ) : (
                  <>Saved {formatDateCompact(app.created_at)}</>
                )}
              </span>
              {app.cv && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3.5" aria-hidden />
                  <span className="max-w-40 truncate">{app.cv.name}</span>
                </span>
              )}
              {app.screenshots.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Image className="size-3.5" aria-hidden />
                  {app.screenshots.length}
                </span>
              )}
              {app.job_url && (
                <a
                  href={app.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 inline-flex items-center gap-0.5 font-medium text-ink-2 hover:text-ink"
                >
                  {hostname(app.job_url)}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
          )}

          {(next || incomplete) && (
            <div className={`flex flex-wrap gap-1.5 ${compact ? "mt-2" : "mt-3"}`}>
              {next && <NextUpChip item={next} />}
              {incomplete && (
                <span className="inline-flex items-center rounded-lg border border-dashed border-line-strong px-2 py-0.5 text-xs font-medium text-ink-3">
                  Needs details
                </span>
              )}
            </div>
          )}

          {compact && (
            <div className="relative z-10 mt-2.5">
              <StatusSelect value={app.status} onChange={onStatusChange} label={`Status for ${role} at ${company}`} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
