import { useState, type FormEvent } from "react";
import { STAGE_KIND_LABEL, STAGE_OUTCOME_META, STAGE_PRESETS } from "../lib/constants";
import { fromDateTimeInputValue, isValidUrl, normalizeUrl, toDateTimeInputValue } from "../lib/format";
import type { Stage, StageInput, StageKind, StageOutcome } from "../lib/types";
import { Button } from "./ui/Button";
import { Field, Input, Select, Textarea } from "./ui/Field";
import { Modal } from "./ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  stage?: Stage;
  saving: boolean;
  onSave: (input: StageInput) => void;
}

export function StageModal(props: Props) {
  // Remount the form whenever the modal opens so it starts from fresh values.
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.stage ? "Edit stage" : "Add a stage"}
      description="An interview round, call or assessment you've been invited to."
      size="lg"
    >
      {props.open && <StageForm key={props.stage?.id ?? "new"} {...props} />}
    </Modal>
  );
}

function StageForm({ applicationId, stage, saving, onSave, onClose }: Props) {
  const [title, setTitle] = useState(stage?.title ?? "");
  const [kind, setKind] = useState<StageKind>(stage?.kind ?? "interview");
  const [when, setWhen] = useState(toDateTimeInputValue(stage?.scheduled_at ?? null));
  const [outcome, setOutcome] = useState<StageOutcome>(stage?.outcome ?? "scheduled");
  const [link, setLink] = useState(stage?.meeting_link ?? "");
  const [notes, setNotes] = useState(stage?.notes ?? "");
  const [errors, setErrors] = useState<{ title?: string; link?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const url = normalizeUrl(link);
    const next = {
      title: title.trim() ? undefined : "Give this stage a name.",
      link: url && !isValidUrl(url) ? "That doesn't look like a valid link." : undefined,
    };
    setErrors(next);
    if (next.title || next.link) return;
    onSave({
      application_id: applicationId,
      title: title.trim(),
      kind,
      scheduled_at: fromDateTimeInputValue(when),
      outcome,
      meeting_link: url,
      notes: notes.trim() || null,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {!stage && (
        <div>
          <p className="mb-2 text-xs font-medium text-ink-3">Quick pick</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGE_PRESETS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setKind(p.kind);
                }}
                className={`rounded-full border px-3 py-1 text-[13px] transition ${
                  title === p.title ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Stage name" error={errors.title}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Technical interview" />
        </Field>
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as StageKind)}>
            {(Object.keys(STAGE_KIND_LABEL) as StageKind[]).map((k) => (
              <option key={k} value={k}>
                {STAGE_KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date & time" optional hint="Shown in your local time zone.">
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <Field label="Outcome">
          <Select value={outcome} onChange={(e) => setOutcome(e.target.value as StageOutcome)}>
            {(Object.keys(STAGE_OUTCOME_META) as StageOutcome[]).map((o) => (
              <option key={o} value={o}>
                {STAGE_OUTCOME_META[o].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Meeting link or address" optional error={errors.link} className="sm:col-span-2">
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Zoom, Teams or Meet link" />
        </Field>
        <Field label="Notes" optional className="sm:col-span-2">
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Who you're meeting, what to prepare, how it went…"
          />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {stage ? "Save stage" : "Add stage"}
        </Button>
      </div>
    </form>
  );
}
