import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { CvPicker, type CvChoice } from "../components/CvPicker";
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
import { isValidUrl, normalizeUrl, toDateInputValue } from "../lib/format";
import {
  useApplication,
  useCreateApplication,
  useDocuments,
  useUpdateApplication,
  useUploadCv,
} from "../lib/queries";
import type {
  ApplicationInput,
  ApplicationStatus,
  ApplicationWithRelations,
  EmploymentType,
  WorkMode,
} from "../lib/types";
import { ErrorPanel, NotFound, PageSkeleton } from "./states";

export function NewApplicationPage() {
  const docs = useDocuments();
  if (docs.isLoading) return <PageSkeleton rows={3} />;
  return <ApplicationForm />;
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

function initialState(app?: ApplicationWithRelations): FormState {
  return {
    company: app?.company ?? "",
    role: app?.role ?? "",
    location: app?.location ?? "",
    work_mode: app?.work_mode ?? null,
    employment_type: app?.employment_type ?? "",
    salary: app?.salary ?? "",
    job_url: app?.job_url ?? "",
    source: app?.source ?? "",
    status: app?.status ?? "applied",
    applied_on: app?.applied_on ?? (app ? "" : toDateInputValue()),
    closing_date: app?.closing_date ?? "",
    job_description: app?.job_description ?? "",
    notes: app?.notes ?? "",
  };
}

type Errors = Partial<Record<keyof FormState | "cv", string>>;

function validate(s: FormState): Errors {
  const e: Errors = {};
  if (!s.company.trim()) e.company = "Add the company name.";
  if (!s.role.trim()) e.role = "Add the job title.";
  const url = normalizeUrl(s.job_url);
  if (url && !isValidUrl(url)) e.job_url = "That doesn't look like a valid link.";
  if (s.status !== "wishlist" && !s.applied_on) e.applied_on = "When did you apply?";
  if (s.applied_on && s.applied_on > toDateInputValue()) e.applied_on = "This date is in the future.";
  return e;
}

function ApplicationForm({ existing }: { existing?: ApplicationWithRelations }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { data: documents = [] } = useDocuments();
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const uploadCv = useUploadCv();

  const [state, setState] = useState<FormState>(() => initialState(existing));
  const [cv, setCv] = useState<CvChoice>(
    existing?.cv_id ? { mode: "existing", id: existing.cv_id } : { mode: "none" },
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(state);
    setErrors(found);
    const firstError = Object.keys(found)[0];
    if (firstError) {
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
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
        company: state.company.trim(),
        role: state.role.trim(),
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
        toast.success(`${created.company} added to your shortlist`);
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
        <p className={eyebrowClass}>{existing ? "Edit" : "New application"}</p>
        <h1 className="mt-2 font-display text-[40px] leading-[1.05] tracking-tight sm:text-5xl">
          {existing ? (
            <>
              {existing.role} <em className="text-ink-2">at {existing.company}</em>
            </>
          ) : (
            "What did you apply for?"
          )}
        </h1>
      </header>

      <div className="mt-8 space-y-5">
        <Section title="The role" description="The basics, as they appear on the job ad.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" error={errors.company}>
              <Input
                value={state.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="e.g. Shopify"
                autoFocus={!existing}
                autoComplete="organization"
              />
            </Field>
            <Field label="Job title" error={errors.role}>
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
          <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
            <Field label="Job posting link" optional error={errors.job_url}>
              <Input
                type="url"
                inputMode="url"
                value={state.job_url}
                onChange={(e) => set("job_url", e.target.value)}
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
          </div>
        </Section>

        <Section title="Status & dates">
          <div className="grid gap-4 sm:grid-cols-3">
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
