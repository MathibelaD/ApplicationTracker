import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { formatFileSize } from "../lib/format";
import { imageFilesFrom, validateImageFile } from "../lib/images";
import { usePasteImages } from "../lib/usePasteImages";

const MAX_FILES = 8;

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  /** Big, inviting drop target for quick add; compact for the full form. */
  variant?: "hero" | "compact";
  invalid?: boolean;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Collects screenshots before the application exists; they upload on save. */
export function ScreenshotDropzone({ files, onChange, variant = "compact", invalid }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add(incoming: File[]) {
    const ok: File[] = [];
    for (const f of incoming) {
      const err = validateImageFile(f);
      if (err) setError(err);
      else ok.push(f);
    }
    if (ok.length === 0) return;
    const next = [...files, ...ok].slice(0, MAX_FILES);
    setError(files.length + ok.length > MAX_FILES ? `You can add up to ${MAX_FILES} screenshots.` : null);
    onChange(next);
  }

  usePasteImages(add);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    add(imageFilesFrom(e.dataTransfer.files));
  }

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const hero = variant === "hero";

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed transition ${
          dragging
            ? "border-accent bg-accent-soft/50"
            : invalid
              ? "border-danger/60"
              : "border-line-strong"
        } ${hero ? "p-4 sm:p-5" : "p-3"}`}
      >
        {files.length > 0 && (
          <ul className={`grid gap-3 ${hero ?"grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-4"}`}>
            {files.map((f, i) => (
              <li key={previews[i]} className="group relative overflow-hidden rounded-xl border border-line bg-surface-2">
                <img src={previews[i]} alt={`Screenshot ${i + 1}`} className="aspect-[4/3] w-full object-cover object-top" />
                <div className="flex items-center justify-between gap-2 border-t border-line bg-surface px-2.5 py-1.5">
                  <span className="truncate text-[11px] text-ink-3">{formatFileSize(f.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  className="absolute right-1.5 top-1.5 rounded-full bg-ink/75 p-1 text-bg opacity-90 backdrop-blur transition hover:opacity-100"
                  aria-label={`Remove screenshot ${i + 1}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div
          className={`flex flex-col items-center justify-center text-center ${
            files.length > 0 ? "pt-4" : hero ? "py-10 sm:py-14" : "py-5"
          }`}
        >
          {files.length === 0 && (
            <span
              className={`mb-3 inline-flex items-center justify-center rounded-2xl bg-surface text-ink-2 shadow-sm ring-1 ring-line ${
                hero ? "size-14" : "size-10"
              }`}
            >
              <ImagePlus className={hero ? "size-6" : "size-5"} aria-hidden />
            </span>
          )}
          <p className={hero && files.length === 0 ? "text-[15px] font-medium" : "text-sm text-ink-2"}>
            {files.length === 0 ? (
              <>
                Paste a screenshot with{" "}
                <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-xs font-medium">
                  {isMac ? "⌘" : "Ctrl"} V
                </kbd>
              </>
            ) : (
              "Add another"
            )}
          </p>
          <p className="mt-1 text-sm text-ink-3">
            or drop it here, or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-ink underline underline-offset-4"
            >
              browse
            </button>
          </p>
          {files.length === 0 && hero && (
            <p className="mt-3 text-xs text-ink-3">PNG, JPG, WebP or GIF · up to {MAX_FILES} images</p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            add(imageFilesFrom(e.target.files));
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
