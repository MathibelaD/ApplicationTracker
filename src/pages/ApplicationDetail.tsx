import {
  ArrowLeft,
  ArrowUpRight,
  CalendarPlus,
  ClipboardList,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Video,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AssignmentModal } from "../components/AssignmentModal";
import { ScreenshotGallery } from "../components/ScreenshotGallery";
import { AdSkills } from "../components/skills/AdSkills";
import { StageModal } from "../components/StageModal";
import { Button } from "../components/ui/Button";
import { CompanyAvatar } from "../components/ui/CompanyAvatar";
import { ConfirmDialog } from "../components/ui/Modal";
import { StatusSelect } from "../components/ui/Status";
import { errorMessage, useToast } from "../components/ui/Toast";
import { buttonClass, cardClass, eyebrowClass } from "../components/ui/styles";
import {
  ASSIGNMENT_STATUS_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  STAGE_KIND_LABEL,
  STAGE_OUTCOME_META,
  STATUS_META,
  WORK_MODE_LABEL,
} from "../lib/constants";
import { companyName, needsDetails, roleTitle } from "../lib/display";
import { daysUntil, formatDate, formatDateTime, hostname, relativeDay, toDateInputValue } from "../lib/format";
import {
  downloadCv,
  openCv,
  useApplication,
  useDeleteApplication,
  useDeleteAssignment,
  useDeleteStage,
  useSaveAssignment,
  useSaveStage,
  useUpdateApplication,
  useUpdateAssignment,
  useUpdateStage,
} from "../lib/queries";
import type {
  ApplicationStatus,
  ApplicationWithRelations,
  Assignment,
  AssignmentInput,
  Stage,
  StageInput,
  StageOutcome,
} from "../lib/types";
import { useChangeStatus } from "../lib/useChangeStatus";
import { ErrorPanel, NotFound, PageSkeleton } from "./states";

export function ApplicationDetail() {
  const { id } = useParams();
  const { data: app, isLoading, error, refetch } = useApplication(id);

  if (isLoading) return <PageSkeleton rows={3} />;
  if (error) return <ErrorPanel error={error} onRetry={refetch} />;
  if (!app) return <NotFound what="application" />;
  return <Detail app={app} />;
}

function Detail({ app }: { app: ApplicationWithRelations }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { change, pending } = useChangeStatus();
  const remove = useDeleteApplication();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const company = companyName(app);
  const role = roleTitle(app);
  const incomplete = needsDetails(app);

  const facts: { label: string; value: ReactNode }[] = [
    {
      label: "Applied",
      value: app.applied_on ? (
        <>
          {formatDate(app.applied_on)}
          <span className="block text-xs font-normal text-ink-3">{relativeDay(app.applied_on)}</span>
        </>
      ) : (
        <span className="text-ink-3">Not yet</span>
      ),
    },
    {
      label: "Closing date",
      value: app.closing_date ? (
        <>
          {formatDate(app.closing_date)}
          <span
            className={`block text-xs font-normal ${
              daysUntil(app.closing_date) < 0
                ? "text-ink-3"
                : daysUntil(app.closing_date) <= 3
                  ? "text-warn"
                  : "text-ink-3"
            }`}
          >
            {daysUntil(app.closing_date) < 0 ? "Closed" : `Closes ${relativeDay(app.closing_date)}`}
          </span>
        </>
      ) : (
        <span className="text-ink-3">—</span>
      ),
    },
    { label: "Salary", value: app.salary ?? <span className="text-ink-3">—</span> },
    {
      label: "Type",
      value: app.employment_type ? EMPLOYMENT_TYPE_LABEL[app.employment_type] : <span className="text-ink-3">—</span>,
    },
  ];

  async function onDelete() {
    try {
      await remove.mutateAsync(app);
      toast.success("Application deleted");
      navigate("/applications", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="animate-rise">
      <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Applications
      </Link>

      {/* Header */}
      <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <CompanyAvatar name={company} size="lg" />
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-ink-2">{company}</p>
            <h1 className="mt-0.5 font-display text-[36px] leading-[1.05] tracking-tight sm:text-[44px]">{role}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
              <StatusSelect value={app.status} onChange={(s: ApplicationStatus) => change(app, s)} disabled={pending} />
              {(app.location || app.work_mode) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-ink-3" aria-hidden />
                  {[app.location, app.work_mode && WORK_MODE_LABEL[app.work_mode]].filter(Boolean).join(" · ")}
                </span>
              )}
              {app.source && (
                <span className="inline-flex items-center gap-1.5">
                  <Link2 className="size-4 text-ink-3" aria-hidden />
                  via {app.source}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:shrink-0">
          {app.job_url && (
            <a href={app.job_url} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
              View job posting <ArrowUpRight className="size-4" aria-hidden />
            </a>
          )}
          <Link to={`/applications/${app.id}/edit`} className={buttonClass("secondary")}>
            <Pencil className="size-4" aria-hidden /> Edit
          </Link>
          <Button variant="dangerGhost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete application" title="Delete">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      {incomplete && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-dashed border-line-strong bg-surface-2/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-lime text-[#14140f]">
              <Zap className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium">Quick-added</p>
              <p className="text-sm text-ink-2">
                Add the {[!app.company && "company", !app.role && "job title"].filter(Boolean).join(" and ")} so it's easy to
                find later. Your screenshot has the details.
              </p>
            </div>
          </div>
          <Link to={`/applications/${app.id}/edit`} className={buttonClass("primary", "md", "shrink-0")}>
            Complete details
          </Link>
        </div>
      )}

      {/* Key facts */}
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="bg-surface p-4 sm:p-5">
            <dt className={eyebrowClass}>{f.label}</dt>
            <dd className="mt-2 text-[15px] font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {incomplete && <ScreenshotGallery applicationId={app.id} screenshots={app.screenshots} />}
          <StagesSection app={app} />
          <AssignmentsSection app={app} />
          {!incomplete && <ScreenshotGallery applicationId={app.id} screenshots={app.screenshots} />}
          <DescriptionSection app={app} />
        </div>

        <aside className="space-y-6">
          <CvCard app={app} />
          {app.job_url && (
            <section className={`${cardClass} p-5`}>
              <h2 className={eyebrowClass}>Job posting</h2>
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-line-strong"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-surface-2">
                  <ExternalLink className="size-4 text-ink-2" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{hostname(app.job_url)}</span>
                  <span className="block truncate text-xs text-ink-3">{app.job_url}</span>
                </span>
              </a>
            </section>
          )}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <h2 className={eyebrowClass}>Notes</h2>
              <Link to={`/applications/${app.id}/edit`} className="text-xs font-medium text-ink-2 hover:text-ink">
                Edit
              </Link>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
              {app.notes || <span className="text-ink-3">No notes yet.</span>}
            </p>
          </section>
          <p className="px-1 text-xs text-ink-3">
            Added {formatDate(app.created_at)} · Updated {relativeDay(app.updated_at)}
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        loading={remove.isPending}
        title="Delete this application?"
        description={
          <>
            <strong className="text-ink">{role}</strong> at {company}, along with its stages, assignments and screenshots,
            will be permanently removed. Your CV stays in your library.
          </>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function CvCard({ app }: { app: ApplicationWithRelations }) {
  const toast = useToast();
  const [busy, setBusy] = useState<"view" | "download" | null>(null);

  async function run(kind: "view" | "download") {
    if (!app.cv) return;
    setBusy(kind);
    try {
      if (kind === "view") await openCv(app.cv.file_path);
      else await downloadCv(app.cv.file_path, app.cv.file_name);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className={eyebrowClass}>CV sent</h2>
      {app.cv ? (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-ink">
              <FileText className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{app.cv.name}</p>
              <p className="truncate text-xs text-ink-3">{app.cv.file_name}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => run("view")} loading={busy === "view"}>
              <Eye className="size-4" aria-hidden /> View
            </Button>
            <Button variant="secondary" size="sm" onClick={() => run("download")} loading={busy === "download"}>
              <Download className="size-4" aria-hidden /> Download
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-ink-3">No CV attached.</p>
          <Link to={`/applications/${app.id}/edit`} className={buttonClass("secondary", "sm", "mt-3 w-full")}>
            Attach a CV
          </Link>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------

const OUTCOME_DOT: Record<StageOutcome, string> = {
  scheduled: "bg-sky-500",
  awaiting: "bg-amber-500",
  passed: "bg-emerald-600",
  unsuccessful: "bg-rose-500",
};

function StagesSection({ app }: { app: ApplicationWithRelations }) {
  const toast = useToast();
  const save = useSaveStage();
  const updateStage = useUpdateStage();
  const remove = useDeleteStage();
  const updateApp = useUpdateApplication();
  const [editing, setEditing] = useState<Stage | "new" | null>(null);
  const [deleting, setDeleting] = useState<Stage | null>(null);

  function onSave(input: StageInput) {
    const isNew = editing === "new";
    save.mutate(
      { id: isNew ? undefined : (editing as Stage).id, input },
      {
        onSuccess: () => {
          setEditing(null);
          toast.success(isNew ? "Stage added" : "Stage updated");
          // Moving forward? Advance the application status to match.
          const target: ApplicationStatus | null =
            !isNew
              ? null
              : app.status === "wishlist" || app.status === "applied"
                ? input.kind === "screening"
                  ? "screening"
                  : "interviewing"
                : app.status === "screening" && input.kind !== "screening"
                  ? "interviewing"
                  : null;
          if (target) {
            updateApp.mutate(
              { id: app.id, patch: { status: target, applied_on: app.applied_on ?? toDateInputValue() } },
              { onSuccess: () => toast.success(`Status moved to ${STATUS_META[target].label}`) },
            );
          }
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  function setOutcome(stage: Stage, outcome: StageOutcome) {
    updateStage.mutate(
      { id: stage.id, patch: { outcome } },
      { onError: (err) => toast.error(errorMessage(err)) },
    );
  }

  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <SectionHeader
        title="Stages"
        subtitle="Every round after you applied"
        action={
          <Button variant="secondary" size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden /> Add stage
          </Button>
        }
      />

      <ol className="mt-5">
        {/* The application itself is always the first step. */}
        <TimelineRow dot={STATUS_META.applied.dot} last={app.stages.length === 0}>
          <p className="text-sm font-medium">Application sent</p>
          <p className="text-xs text-ink-3">
            {app.applied_on ? formatDate(app.applied_on) : "Not applied yet"}
            {app.cv && <> · {app.cv.name}</>}
          </p>
        </TimelineRow>

        {app.stages.map((s, i) => (
          <TimelineRow key={s.id} dot={OUTCOME_DOT[s.outcome]} last={i === app.stages.length - 1}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-ink-3">
                  {STAGE_KIND_LABEL[s.kind]}
                  {s.scheduled_at && (
                    <>
                      {" · "}
                      <time dateTime={s.scheduled_at}>{formatDateTime(s.scheduled_at)}</time>
                      {s.outcome === "scheduled" && <> · {relativeDay(s.scheduled_at)}</>}
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <label className="sr-only" htmlFor={`outcome-${s.id}`}>
                  Outcome for {s.title}
                </label>
                <select
                  id={`outcome-${s.id}`}
                  value={s.outcome}
                  onChange={(e) => setOutcome(s, e.target.value as StageOutcome)}
                  className={`field-sizing-content cursor-pointer appearance-none rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent ${STAGE_OUTCOME_META[s.outcome].badge}`}
                >
                  {(Object.keys(STAGE_OUTCOME_META) as StageOutcome[]).map((o) => (
                    <option key={o} value={o}>
                      {STAGE_OUTCOME_META[o].label}
                    </option>
                  ))}
                </select>
                <IconButton label={`Edit ${s.title}`} onClick={() => setEditing(s)}>
                  <Pencil className="size-3.5" />
                </IconButton>
                <IconButton label={`Delete ${s.title}`} onClick={() => setDeleting(s)} danger>
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
            </div>
            {s.meeting_link && (
              <a
                href={s.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink"
              >
                <Video className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{hostname(s.meeting_link)}</span>
                <ArrowUpRight className="size-3 shrink-0" aria-hidden />
              </a>
            )}
            {s.notes && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{s.notes}</p>}
          </TimelineRow>
        ))}
      </ol>

      {app.stages.length === 0 && (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-4 text-sm text-ink-2 transition hover:border-ink-3 hover:text-ink"
        >
          <CalendarPlus className="size-4" aria-hidden />
          Heard back? Add a screening call or interview
        </button>
      )}

      <StageModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        applicationId={app.id}
        stage={editing && editing !== "new" ? editing : undefined}
        saving={save.isPending}
        onSave={onSave}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title="Delete this stage?"
        description={<>“{deleting?.title}” will be removed from the timeline.</>}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success("Stage deleted");
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </section>
  );
}

function TimelineRow({ dot, last, children }: { dot: string; last: boolean; children: ReactNode }) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!last && <span className="absolute left-[5px] top-4 h-full w-px bg-line" aria-hidden />}
      <span className={`relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-surface ${dot}`} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

function IconButton({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 text-ink-3 transition ${danger ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-2 hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

function dueLabel(a: Assignment) {
  if (!a.due_at) return null;
  const overdue = a.status !== "submitted" && new Date(a.due_at).getTime() < Date.now();
  const soon = !overdue && a.status !== "submitted" && daysUntil(a.due_at) <= 2;
  return {
    text: `Due ${formatDateTime(a.due_at)}${a.status !== "submitted" ? ` · ${relativeDay(a.due_at)}` : ""}`,
    tone: overdue ? "text-danger" : soon ? "text-warn" : "text-ink-3",
    overdue,
  };
}

function AssignmentsSection({ app }: { app: ApplicationWithRelations }) {
  const toast = useToast();
  const save = useSaveAssignment();
  const update = useUpdateAssignment();
  const remove = useDeleteAssignment();
  const [editing, setEditing] = useState<Assignment | "new" | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);

  function onSave(input: AssignmentInput) {
    const isNew = editing === "new";
    save.mutate(
      { id: isNew ? undefined : (editing as Assignment).id, input },
      {
        onSuccess: () => {
          setEditing(null);
          toast.success(isNew ? "Assignment added" : "Assignment updated");
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  function toggleSubmitted(a: Assignment) {
    const status = a.status === "submitted" ? "todo" : "submitted";
    update.mutate(
      { id: a.id, patch: { status } },
      {
        onSuccess: () => status === "submitted" && toast.success("Nice work — marked as submitted"),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <SectionHeader
        title="Assignments"
        subtitle="Take-home tasks, tests and case studies"
        action={
          <Button variant="secondary" size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden /> Add
          </Button>
        }
      />

      {app.assignments.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-4 text-sm text-ink-2 transition hover:border-ink-3 hover:text-ink"
        >
          <ClipboardList className="size-4" aria-hidden />
          Got a take-home? Track its link and due date
        </button>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {app.assignments.map((a) => {
            const due = dueLabel(a);
            const done = a.status === "submitted";
            return (
              <li key={a.id} className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-0">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggleSubmitted(a)}
                  aria-label={`Mark ${a.title} as ${done ? "not submitted" : "submitted"}`}
                  className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded accent-[var(--accent)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-medium ${done ? "text-ink-3 line-through" : ""}`}>{a.title}</p>
                    {a.status === "in_progress" && (
                      <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn">
                        {ASSIGNMENT_STATUS_LABEL.in_progress}
                      </span>
                    )}
                    {due?.overdue && (
                      <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">Overdue</span>
                    )}
                  </div>
                  {due && <p className={`mt-0.5 text-xs ${due.tone}`}>{due.text}</p>}
                  {a.link && (
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex max-w-full items-center gap-1 text-xs font-medium text-ink-2 hover:text-ink"
                    >
                      <span className="truncate">{hostname(a.link)}</span>
                      <ArrowUpRight className="size-3 shrink-0" aria-hidden />
                    </a>
                  )}
                  {a.notes && <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-2">{a.notes}</p>}
                </div>
                <div className="flex shrink-0">
                  <IconButton label={`Edit ${a.title}`} onClick={() => setEditing(a)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton label={`Delete ${a.title}`} onClick={() => setDeleting(a)} danger>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AssignmentModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        applicationId={app.id}
        assignment={editing && editing !== "new" ? editing : undefined}
        saving={save.isPending}
        onSave={onSave}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title="Delete this assignment?"
        description={<>“{deleting?.title}” will be permanently removed.</>}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success("Assignment deleted");
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </section>
  );
}

// ---------------------------------------------------------------------------

function DescriptionSection({ app }: { app: ApplicationWithRelations }) {
  const [expanded, setExpanded] = useState(false);
  const text = app.job_description;
  if (!text) return null;
  const long = text.length > 700;
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <SectionHeader title="Job description" subtitle="Saved from the original posting" />
      <div className="relative mt-4">
        <p
          className={`whitespace-pre-wrap text-sm leading-7 text-ink-2 ${long && !expanded ? "max-h-64 overflow-hidden" : ""}`}
        >
          {text}
        </p>
        {long && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent" />
        )}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-sm font-medium text-ink underline underline-offset-4"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show full description"}
        </button>
      )}
      <AdSkills app={app} />
    </section>
  );
}
