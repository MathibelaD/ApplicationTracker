import { ArrowLeft, Sparkles, Zap } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { CvPicker, type CvChoice } from "../components/CvPicker";
import { ScreenshotDropzone } from "../components/ScreenshotDropzone";
import { Button } from "../components/ui/Button";
import { Field, Input, Segmented, Select, Textarea } from "../components/ui/Field";
import { errorMessage, useToast } from "../components/ui/Toast";
import { buttonClass, cardClass, eyebrowClass } from "../components/ui/styles";
import {
  EMPLOYMENT_TYPE_LABEL,
  SOURCE_SUGGESTIONS,
  STATUS_META,
  STATUS_ORDER,
  WORK_MODE_LABEL,
} from "../lib/constants";
import { companyName, needsDetails, roleTitle } from "../lib/display";
import { isValidUrl, normalizeUrl, toDateInputValue } from "../lib/format";
import { guessFromUrl } from "../lib/jobUrl";
import {
  useApplication,
  useCreateApplication,
  useDocuments,
  useUpdateApplication,
  useUploadCv,
  useUploadScreenshots,
} from "../lib/queries";
import type {
  ApplicationInput,
  ApplicationStatus,
  ApplicationWithRelations,
  EmploymentType,
  WorkMode,
} from "../lib/types";
import { ErrorPanel, NotFound, PageSkeleton } from "./states";

type Mode = "quick" | "full";

function readMode(): Mode {
  try {
    return localStorage.getItem("new-application-mode") === "full" ? "full" : "quick";
  } catch {
    return "quick";
  }
}

export function NewApplicationPage() {
  const docs = useDocuments();
  const [mode, setMode] = useState<Mode>(readMode);
  // Carry what was entered across when switching modes.
  const [draft, setDraft] = useState<{ jobUrl: string; files: File[] }>({ jobUrl: "", files: [] });

  function switchTo(next: Mode) {
    setMode(next);
    try {
      localStorage.setItem("new-application-mode", next);
    } catch {
      // ignore
    }
  }

  if (docs.isLoading) return <PageSkeleton rows={3} />;

  const modeSwitch = <ModeSwitch mode={mode} onChange={switchTo} />;
  return mode === "quick" ? (
    <QuickAddForm modeSwitch={modeSwitch} draft={draft} onDraftChange={setDraft} />
  ) : (
    <ApplicationForm key="full" modeSwitch={modeSwitch} draft={draft} onDraftChange={setDraft} />
  );
}

export function EditApplicationPage() {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useApplication(id);
  const docs = useDocuments();
  if (isLoading || docs.isLoading) return <PageSkeleton rows={3} />;
  if (error) return <ErrorPanel error={error} onRetry={refetch} />;
  if (!data) return <NotFound what="application" />;
  return <ApplicationForm existing={data} />;
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const options: { value: Mode; label: string; hint: string; icon: ReactNode }[] = [
    { value: "quick", label: "Quick add", hint: "Link + screenshot", icon: <Zap className="size-4" aria-hidden /> },
    { value: "full", label: "Full details", hint: "Everything up front", icon: <Sparkles className="size-4" aria-hidden /> },
  ];
  return (
    <div role="radiogroup" aria-label="How do you want to add it?" className="mt-6 grid max-w-md grid-cols-2 gap-1 rounded-2xl border border-line bg-surface-2 p-1">
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${
              active ? "bg-surface shadow-sm ring-1 ring-line" : "text-ink-2 hover:text-ink"
            }`}
          >
            <span className={active ? "text-accent-soft-ink" : ""}>{o.icon}</span>
            <span>
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-xs text-ink-3">{o.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface DraftProps {
  modeSwitch: ReactNode;
  draft: { jobUrl: string; files: File[] };
  onDraftChange: (d: { jobUrl: string; files: File[] }) => void;
}

function useSaveScreenshots() {
  const { user } = useAuth();
  const toast = useToast();
  const upload = useUploadScreenshots();
  return async (applicationId: string, files: File[]) => {
    if (!files.length || !user) return;
    const { failed, firstError } = await upload.mutateAsync({ userId: user.id, applicationId, files });
    if (failed) toast.error(`Saved, but ${failed} screenshot${failed > 1 ? "s" : ""} didn't upload: ${firstError?.message ?? ""}`);
  };
}

// ---------------------------------------------------------------------------
// Quick add: just the link and/or a screenshot
// ---------------------------------------------------------------------------

function QuickAddForm({ modeSwitch, draft, onDraftChange }: DraftProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateApplication();
  const saveScreenshots = useSaveScreenshots();
  const [applied, setApplied] = useState<"applied" | "wishlist">("applied");
  const [error, setError] = useState<{ url?: string; empty?: string }>({});
  const [saving, setSaving] = useState(false);

  const { jobUrl, files } = draft;
  const guess = guessFromUrl(jobUrl);
  const url = normalizeUrl(jobUrl);
  const urlInvalid = Boolean(url && !isValidUrl(url));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = {
      url: urlInvalid ? "That doesn't look like a valid link." : undefined,
      empty: !url && files.length === 0 ? "Add the job link, a screenshot, or both." : undefined,
    };
    setError(next);
    if (next.url || next.empty) return;

    setSaving(true);
    try {
      const created = await create.mutateAsync({
        company: guess.company ?? null,
        role: null,
        location: null,
        work_mode: null,
        employment_type: null,
        salary: null,
        job_url: url,
        source: guess.source ?? null,
        job_description: null,
        status: applied,
        applied_on: applied === "applied" ? toDateInputValue() : null,
        closing_date: null,
        cv_id: null,
        notes: null,
      });
      await saveScreenshots(created.id, files);
      toast.success("Saved. Add the details whenever you're ready.");
      navigate(`/applications/${created.id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="animate-rise">
      <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Applications
      </Link>

      <header className="mt-4">
        <p className={eyebrowClass}>New application</p>
        <h1 className="mt-2 font-display text-[40px] leading-[1.05] tracking-tight sm:text-5xl">
          Just drop in the job ad
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-2">
          Paste the link and a screenshot of the listing. You can fill in the company, role and the rest later.
        </p>
        {modeSwitch}
      </header>

      <div className={`${cardClass} mt-6 space-y-5 p-5 sm:p-6`}>
        <Field label="Job posting link" error={error.url}>
          <Input
            type="url"
            inputMode="url"
            value={jobUrl}
            onChange={(e) => {
              onDraftChange({ ...draft, jobUrl: e.target.value });
              setError({});
            }}
            placeholder="https://www.linkedin.com/jobs/view/…"
            autoFocus
          />
        </Field>
        {(guess.company || guess.source) && !urlInvalid && (
          <p className="-mt-3 text-xs text-ink-3">
            Looks like{" "}
            {guess.company && <span className="font-medium text-ink-2">{guess.company}</span>}
            {guess.company && guess.source && " via "}
            {guess.source && <span className="font-medium text-ink-2">{guess.source}</span>}
          </p>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium">Screenshot of the listing</p>
          <ScreenshotDropzone
            variant="hero"
            files={files}
            invalid={Boolean(error.empty)}
            onChange={(next) => {
              onDraftChange({ ...draft, files: next });
              setError({});
            }}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">Have you applied yet?</p>
          <Segmented
            label="Have you applied yet?"
            value={applied}
            onChange={(v) => v && setApplied(v)}
            options={[
              { value: "applied", label: "Yes, applied today" },
              { value: "wishlist", label: "Not yet, saving it" },
            ]}
          />
        </div>

        {error.empty && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error.empty}
          </p>
        )}
      </div>

      <div className="sticky bottom-[76px] z-20 -mx-4 mt-6 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:bottom-0 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-end gap-2">
          <Link to="/applications" className={buttonClass("ghost")}>
            Cancel
          </Link>
          <Button type="submit" loading={saving} className="min-w-36">
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Full form (new + edit)
// ---------------------------------------------------------------------------

interface FormState {
  company: string;
  role: string;
  location: string;
  work_mode: WorkMode | null;
  employment_type: EmploymentType | "";
  salary: string;
  job_url: string;
  source: string;
  status: ApplicationStatus;
  applied_on: string;
  closing_date: string;
  job_description: string;
  notes: string;
}

function initialState(app?: ApplicationWithRelations, jobUrl = ""): FormState {
  const guess = app ? {} : guessFromUrl(jobUrl);
  return {
    company: app?.company ?? guess.company ?? "",
    role: app?.role ?? "",
    location: app?.location ?? "",
    work_mode: app?.work_mode ?? null,
    employment_type: app?.employment_type ?? "",
    salary: app?.salary ?? "",
    job_url: app?.job_url ?? jobUrl,
    source: app?.source ?? guess.source ?? "",
    status: app?.status ?? "applied",
    applied_on: app?.applied_on ?? (app ? "" : toDateInputValue()),
    closing_date: app?.closing_date ?? "",
    job_description: app?.job_description ?? "",
    notes: app?.notes ?? "",
  };
}

type Errors = Partial<Record<keyof FormState | "cv", string>>;

function validate(s: FormState, requireNames: boolean): Errors {
  const e: Errors = {};
  if (requireNames && !s.company.trim()) e.company = "Add the company name.";
  if (requireNames && !s.role.trim()) e.role = "Add the job title.";
  const url = normalizeUrl(s.job_url);
  if (url && !isValidUrl(url)) e.job_url = "That doesn't look like a valid link.";
  if (s.status !== "wishlist" && !s.applied_on) e.applied_on = "When did you apply?";
  if (s.applied_on && s.applied_on > toDateInputValue()) e.applied_on = "This date is in the future.";
  return e;
}

function ApplicationForm({
  existing,
  modeSwitch,
  draft,
  onDraftChange,
}: { existing?: ApplicationWithRelations } & Partial<DraftProps>) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { data: documents = [] } = useDocuments();
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const uploadCv = useUploadCv();
  const saveScreenshots = useSaveScreenshots();

  const [state, setState] = useState<FormState>(() => initialState(existing, draft?.jobUrl));
  const [cv, setCv] = useState<CvChoice>(
    existing?.cv_id ? { mode: "existing", id: existing.cv_id } : { mode: "none" },
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // Completing a quick-added application shouldn't force every field at once.
  const requireNames = !(existing && needsDetails(existing));
  const files = draft?.files ?? [];

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function fillFromLink() {
    const guess = guessFromUrl(state.job_url);
    setState((s) => ({
      ...s,
      company: s.company || guess.company || "",
      source: s.source || guess.source || "",
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(state, requireNames);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }

    setSaving(true);
    try {
      let cvId: string | null = cv.mode === "existing" ? cv.id : null;
      if (cv.mode === "upload") {
        const doc = await uploadCv.mutateAsync({ userId: user!.id, file: cv.file, name: cv.name });
        cvId = doc.id;
      }

      const payload: ApplicationInput = {
        company: state.company.trim() || null,
        role: state.role.trim() || null,
        location: state.location.trim() || null,
        work_mode: state.work_mode,
        employment_type: state.employment_type || null,
        salary: state.salary.trim() || null,
        job_url: normalizeUrl(state.job_url),
        source: state.source.trim() || null,
        status: state.status,
        applied_on: state.applied_on || null,
        closing_date: state.closing_date || null,
        job_description: state.job_description.trim() || null,
        notes: state.notes.trim() || null,
        cv_id: cvId,
      };

      if (existing) {
        await update.mutateAsync({ id: existing.id, patch: payload });
        toast.success("Changes saved");
        navigate(`/applications/${existing.id}`);
      } else {
        const created = await create.mutateAsync(payload);
        await saveScreenshots(created.id, files);
        toast.success(`${companyName(created)} added to your SmartWebSync Application Tracker`);
        navigate(`/applications/${created.id}`);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const back = existing ? `/applications/${existing.id}` : "/applications";

  return (
    <form onSubmit={onSubmit} noValidate className="animate-rise">
      <Link to={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {existing ? "Back to application" : "Applications"}
      </Link>

      <header className="mt-4">
        <p className={eyebrowClass}>{existing ? (requireNames ? "Edit" : "Complete details") : "New application"}</p>
        <h1 className="mt-2 font-display text-[40px] leading-[1.05] tracking-tight sm:text-5xl">
          {existing ? (
            <>
              {roleTitle(existing)} <em className="text-ink-2">at {companyName(existing)}</em>
            </>
          ) : (
            "What did you apply for?"
          )}
        </h1>
        {modeSwitch}
      </header>

      <div className="mt-8 space-y-5">
        <Section title="The role" description="The basics, as they appear on the job ad.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company" error={errors.company} optional={!requireNames}>
              <Input
                value={state.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="e.g. Shopify"
                autoFocus={!existing || !requireNames}
                autoComplete="organization"
              />
            </Field>
            <Field label="Job title" error={errors.role} optional={!requireNames}>
              <Input value={state.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Frontend Developer" />
            </Field>
            <Field label="Location" optional>
              <Input
                value={state.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="City, country"
              />
            </Field>
            <Field label="Salary" optional hint="Whatever was advertised or discussed.">
              <Input value={state.salary} onChange={(e) => set("salary", e.target.value)} placeholder="e.g. €55k–65k / year" />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium">Work arrangement</p>
              <Segmented
                label="Work arrangement"
                value={state.work_mode}
                onChange={(v) => set("work_mode", v)}
                allowEmpty
                options={(Object.keys(WORK_MODE_LABEL) as WorkMode[]).map((v) => ({ value: v, label: WORK_MODE_LABEL[v] }))}
              />
            </div>
            <Field label="Employment type" optional>
              <Select value={state.employment_type} onChange={(e) => set("employment_type", e.target.value as EmploymentType | "")}>
                <option value="">Not specified</option>
                {(Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map((t) => (
                  <option key={t} value={t}>
                    {EMPLOYMENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Where you found it" description="So you can always get back to the original posting.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
            <Field label="Job posting link" optional error={errors.job_url}>
              <Input
                type="url"
                inputMode="url"
                value={state.job_url}
                onChange={(e) => {
                  set("job_url", e.target.value);
                  onDraftChange?.({ jobUrl: e.target.value, files });
                }}
                onBlur={fillFromLink}
                placeholder="https://"
              />
            </Field>
            <Field label="Source" optional>
              <Input
                list="source-suggestions"
                value={state.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder="LinkedIn, referral…"
              />
            </Field>
            <datalist id="source-suggestions">
              {SOURCE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {existing ? (
              <p className="text-xs text-ink-3 sm:col-span-2">
                {existing.screenshots.length > 0
                  ? `${existing.screenshots.length} screenshot${existing.screenshots.length > 1 ? "s" : ""} saved. `
                  : ""}
                Add or remove listing screenshots on the{" "}
                <Link to={`/applications/${existing.id}`} className="font-medium text-ink-2 underline underline-offset-4">
                  application page
                </Link>
                .
              </p>
            ) : (
              <div className="sm:col-span-2">
                <p className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
                  Screenshots of the listing <span className="text-xs font-normal text-ink-3">Optional</span>
                </p>
                <ScreenshotDropzone files={files} onChange={(next) => onDraftChange?.({ jobUrl: state.job_url, files: next })} />
              </div>
            )}
          </div>
        </Section>

        <Section title="Status & dates">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Status">
              <Select
                value={state.status}
                onChange={(e) => {
                  const status = e.target.value as ApplicationStatus;
                  set("status", status);
                  if (status !== "wishlist" && !state.applied_on) set("applied_on", toDateInputValue());
                }}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date applied" optional={state.status === "wishlist"} error={errors.applied_on}>
              <Input
                type="date"
                value={state.applied_on}
                max={toDateInputValue()}
                onChange={(e) => set("applied_on", e.target.value)}
              />
            </Field>
            <Field label="Closing date" optional hint="When applications close.">
              <Input type="date" value={state.closing_date} onChange={(e) => set("closing_date", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="CV used" description="Pick the version you sent, or upload it now.">
          <CvPicker documents={documents} value={cv} onChange={setCv} />
        </Section>

        <Section title="Job details" description="Job ads disappear. Paste the description here so you can prep for interviews later.">
          <div className="space-y-4">
            <Field label="Job description" optional>
              <Textarea
                rows={8}
                value={state.job_description}
                onChange={(e) => set("job_description", e.target.value)}
                placeholder="Responsibilities, requirements, benefits…"
              />
            </Field>
            <Field label="Notes" optional>
              <Textarea
                rows={3}
                value={state.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Recruiter name, why you're excited, things to ask…"
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-[76px] z-20 -mx-4 mt-6 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:bottom-0 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-end gap-2">
          <Link to={back} className={buttonClass("ghost")}>
            Cancel
          </Link>
          <Button type="submit" loading={saving} className="min-w-36">
            {existing ? "Save changes" : "Save application"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={`${cardClass} grid gap-5 p-5 sm:p-6 lg:grid-cols-[220px_1fr] lg:gap-8`}>
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-ink-3">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
