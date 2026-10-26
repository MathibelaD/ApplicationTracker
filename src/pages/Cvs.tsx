import { Download, Eye, FileText, Pencil, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { ConfirmDialog, Modal } from "../components/ui/Modal";
import { errorMessage, useToast } from "../components/ui/Toast";
import { cardClass, eyebrowClass } from "../components/ui/styles";
import { validateCvFile } from "../lib/cv";
import { formatDate, formatFileSize } from "../lib/format";
import {
  downloadCv,
  openCv,
  useApplications,
  useDeleteDocument,
  useDocuments,
  useRenameDocument,
  useUploadCv,
} from "../lib/queries";
import type { CvDocument } from "../lib/types";
import { ErrorPanel, PageSkeleton } from "./states";

export function Cvs() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: docs = [], isLoading, error, refetch } = useDocuments();
  const { data: apps = [] } = useApplications();
  const upload = useUploadCv();
  const rename = useRenameDocument();
  const remove = useDeleteDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [renaming, setRenaming] = useState<CvDocument | null>(null);
  const [deleting, setDeleting] = useState<CvDocument | null>(null);

  const usage = useMemo(() => {
    const map = new Map<string, { id: string; label: string }[]>();
    for (const a of apps) {
      if (!a.cv_id) continue;
      const list = map.get(a.cv_id) ?? [];
      list.push({ id: a.id, label: `${a.role} · ${a.company}` });
      map.set(a.cv_id, list);
    }
    return map;
  }, [apps]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const err = validateCvFile(file);
      if (err) {
        toast.error(`${file.name}: ${err}`);
        continue;
      }
      try {
        await upload.mutateAsync({ userId: user!.id, file, name: file.name.replace(/\.[^.]+$/, "") });
        toast.success(`${file.name} uploaded`);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function act(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  if (isLoading) return <PageSkeleton rows={3} />;
  if (error) return <ErrorPanel error={error} onRetry={refetch} />;

  const deletingUses = deleting ? (usage.get(deleting.id)?.length ?? 0) : 0;

  return (
    <div className="animate-rise">
      <header>
        <p className={eyebrowClass}>Library</p>
        <h1 className="mt-2 font-display text-[40px] leading-none tracking-tight sm:text-5xl">My CVs</h1>
        <p className="mt-3 max-w-xl text-[15px] text-ink-2">
          Keep every version you send out. Attach one to each application so you always know exactly what a recruiter saw.
        </p>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-8 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-accent bg-accent-soft/50" : "border-line-strong"
        }`}
      >
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-surface text-ink-2 shadow-sm ring-1 ring-line">
          <Upload className="size-5" aria-hidden />
        </span>
        <p className="mt-2 font-medium">Drop CVs here</p>
        <p className="text-sm text-ink-3">PDF or Word · up to 10 MB each · private to you</p>
        <Button className="mt-3" onClick={() => inputRef.current?.click()} loading={upload.isPending}>
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {docs.length > 0 && (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {docs.map((doc) => {
            const used = usage.get(doc.id) ?? [];
            return (
              <li key={doc.id} className={`${cardClass} flex flex-col p-4 sm:p-5`}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-ink">
                    <FileText className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{doc.name}</p>
                    <p className="truncate text-xs text-ink-3">
                      {doc.file_name} · {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex-1 text-sm">
                  {used.length === 0 ? (
                    <p className="text-ink-3">Not attached to any application yet.</p>
                  ) : (
                    <>
                      <p className="text-ink-2">
                        Used in <span className="font-medium text-ink">{used.length}</span>{" "}
                        {used.length === 1 ? "application" : "applications"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {used.slice(0, 3).map((u) => (
                          <Link
                            key={u.id}
                            to={`/applications/${u.id}`}
                            className="max-w-full truncate rounded-md bg-surface-2 px-2 py-1 text-xs text-ink-2 hover:text-ink"
                          >
                            {u.label}
                          </Link>
                        ))}
                        {used.length > 3 && <span className="px-1 py-1 text-xs text-ink-3">+{used.length - 3} more</span>}
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-1 border-t border-line pt-3">
                  <Button variant="ghost" size="sm" onClick={() => act(() => openCv(doc.file_path))}>
                    <Eye className="size-4" aria-hidden /> View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => act(() => downloadCv(doc.file_path, doc.file_name))}>
                    <Download className="size-4" aria-hidden /> Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRenaming(doc)}>
                    <Pencil className="size-4" aria-hidden /> Rename
                  </Button>
                  <Button variant="dangerGhost" size="sm" className="ml-auto" onClick={() => setDeleting(doc)}>
                    <Trash2 className="size-4" aria-hidden /> Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RenameModal
        doc={renaming}
        onClose={() => setRenaming(null)}
        saving={rename.isPending}
        onSave={(name) =>
          renaming &&
          rename.mutate(
            { id: renaming.id, name },
            {
              onSuccess: () => {
                setRenaming(null);
                toast.success("CV renamed");
              },
              onError: (e) => toast.error(errorMessage(e)),
            },
          )
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title="Delete this CV?"
        description={
          deletingUses > 0
            ? `“${deleting?.name}” is attached to ${deletingUses} ${deletingUses === 1 ? "application" : "applications"}. Those applications will be kept, but will no longer have a CV attached.`
            : `“${deleting?.name}” will be permanently deleted.`
        }
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting, {
            onSuccess: () => {
              setDeleting(null);
              toast.success("CV deleted");
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </div>
  );
}

function RenameModal({
  doc,
  onClose,
  onSave,
  saving,
}: {
  doc: CvDocument | null;
  onClose: () => void;
  onSave: (name: string) => void;
  saving: boolean;
}) {
  return (
    <Modal open={doc !== null} onClose={onClose} title="Rename CV" size="sm">
      {doc && <RenameForm key={doc.id} initial={doc.name} onSave={onSave} onClose={onClose} saving={saving} />}
    </Modal>
  );
}

function RenameForm({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: string;
  onSave: (name: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) onSave(name.trim());
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" hint="e.g. “Product Designer CV — 2026”">
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={120} />
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </form>
  );
}
