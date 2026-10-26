import { Check, FileText, FileUp, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { validateCvFile } from "../lib/cv";
import { formatDateCompact, formatFileSize } from "../lib/format";
import type { CvDocument } from "../lib/types";
import { Input } from "./ui/Field";

export type CvChoice =
  | { mode: "none" }
  | { mode: "existing"; id: string }
  | { mode: "upload"; file: File; name: string };

interface Props {
  documents: CvDocument[];
  value: CvChoice;
  onChange: (choice: CvChoice) => void;
}

export function CvPicker({ documents, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function pick(file: File | undefined) {
    if (!file) return;
    const err = validateCvFile(file);
    setError(err);
    if (err) return;
    onChange({ mode: "upload", file, name: file.name.replace(/\.[^.]+$/, "") });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  }

  const optionCls = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
      active ? "border-accent bg-accent-soft/60 ring-1 ring-accent" : "border-line bg-surface hover:border-line-strong"
    }`;

  return (
    <div className="space-y-2">
      {documents.length > 0 && (
        <div role="radiogroup" aria-label="CV used" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {documents.map((doc) => {
            const active = value.mode === "existing" && value.id === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(active ? { mode: "none" } : { mode: "existing", id: doc.id })}
                className={optionCls(active)}
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
                  <FileText className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{doc.name}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {formatFileSize(doc.file_size)} · added {formatDateCompact(doc.created_at)}
                  </span>
                </span>
                {active && <Check className="size-4 shrink-0 text-accent-soft-ink" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}

      {value.mode === "upload" ? (
        <div className={`${optionCls(true)} flex-col items-stretch sm:flex-row sm:items-center`}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-2">
              <FileUp className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <label htmlFor="cv-name" className="sr-only">
                CV name
              </label>
              <Input
                id="cv-name"
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
                placeholder="Name this CV, e.g. Product CV 2026"
                className="!py-1.5"
              />
              <p className="mt-1 truncate text-xs text-ink-3">
                {value.file.name} · {formatFileSize(value.file.size)} · uploads when you save
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange({ mode: "none" })}
            className="self-end text-xs font-medium text-ink-2 hover:text-ink sm:self-center"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center transition ${
            dragging ? "border-accent bg-accent-soft/50" : "border-line-strong"
          }`}
        >
          <Upload className="size-5 text-ink-3" aria-hidden />
          <p className="text-sm text-ink-2">
            Drop a CV here or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-ink underline underline-offset-4"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-ink-3">PDF or Word, up to 10 MB. It's saved to your CV library too.</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
