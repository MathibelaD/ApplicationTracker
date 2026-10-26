import { useState, type FormEvent } from "react";
import { ASSIGNMENT_STATUS_LABEL } from "../lib/constants";
import { fromDateTimeInputValue, isValidUrl, normalizeUrl, toDateTimeInputValue } from "../lib/format";
import type { Assignment, AssignmentInput, AssignmentStatus } from "../lib/types";
import { Button } from "./ui/Button";
import { Field, Input, Segmented, Textarea } from "./ui/Field";
import { Modal } from "./ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  assignment?: Assignment;
  saving: boolean;
  onSave: (input: AssignmentInput) => void;
}

export function AssignmentModal(props: Props) {
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={props.assignment ? "Edit assignment" : "Add an assignment"}
      description="A take-home task, case study or online test."
      size="lg"
    >
      {props.open && <AssignmentForm key={props.assignment?.id ?? "new"} {...props} />}
    </Modal>
  );
}

function AssignmentForm({ applicationId, assignment, saving, onSave, onClose }: Props) {
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [link, setLink] = useState(assignment?.link ?? "");
  const [due, setDue] = useState(toDateTimeInputValue(assignment?.due_at ?? null));
  const [status, setStatus] = useState<AssignmentStatus>(assignment?.status ?? "todo");
  const [notes, setNotes] = useState(assignment?.notes ?? "");
  const [errors, setErrors] = useState<{ title?: string; link?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const url = normalizeUrl(link);
    const next = {
      title: title.trim() ? undefined : "Give the assignment a name.",
      link: url && !isValidUrl(url) ? "That doesn't look like a valid link." : undefined,
    };
    setErrors(next);
    if (next.title || next.link) return;
    onSave({
      application_id: applicationId,
      title: title.trim(),
      link: url,
      due_at: fromDateTimeInputValue(due),
      status,
      notes: notes.trim() || null,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" error={errors.title} className="sm:col-span-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a small dashboard" />
        </Field>
        <Field label="Assignment link" optional error={errors.link} hint="Brief, test platform or repo." className="sm:col-span-2">
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" inputMode="url" />
        </Field>
        <Field label="Due" optional hint="Shown in your local time zone.">
          <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium">Progress</p>
          <Segmented
            label="Progress"
            value={status}
            onChange={(v) => v && setStatus(v)}
            options={(Object.keys(ASSIGNMENT_STATUS_LABEL) as AssignmentStatus[]).map((s) => ({
              value: s,
              label: ASSIGNMENT_STATUS_LABEL[s],
            }))}
          />
        </div>
        <Field label="Notes" optional className="sm:col-span-2">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Requirements, time limit, submission instructions…" />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {assignment ? "Save assignment" : "Add assignment"}
        </Button>
      </div>
    </form>
  );
}
