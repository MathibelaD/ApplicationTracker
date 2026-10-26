import { ChevronLeft, ChevronRight, ExternalLink, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { imageFilesFrom, validateImageFile } from "../lib/images";
import { useDeleteScreenshot, useScreenshotUrls, useUploadScreenshots } from "../lib/queries";
import type { Screenshot } from "../lib/types";
import { usePasteImages } from "../lib/usePasteImages";
import { Button } from "./ui/Button";
import { ConfirmDialog, Modal } from "./ui/Modal";
import { errorMessage, useToast } from "./ui/Toast";
import { buttonClass, cardClass } from "./ui/styles";

interface Props {
  applicationId: string;
  screenshots: Screenshot[];
}

export function ScreenshotGallery({ applicationId, screenshots }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: urls = {}, isLoading } = useScreenshotUrls(screenshots);
  const upload = useUploadScreenshots();
  const remove = useDeleteScreenshot();
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Screenshot | null>(null);
  const [dragging, setDragging] = useState(false);

  function add(files: File[]) {
    const ok = files.filter((f) => {
      const err = validateImageFile(f);
      if (err) toast.error(err);
      return !err;
    });
    if (!ok.length || !user) return;
    upload.mutate(
      { userId: user.id, applicationId, files: ok },
      {
        onSuccess: ({ uploaded, failed, firstError }) => {
          if (uploaded) toast.success(uploaded === 1 ? "Screenshot added" : `${uploaded} screenshots added`);
          if (failed) toast.error(`${failed} couldn't upload: ${firstError?.message ?? "unknown error"}`);
        },
      },
    );
  }

  usePasteImages(add);

  const current = viewing != null ? screenshots[viewing] : null;

  return (
    <section
      className={`${cardClass} p-5 sm:p-6 ${dragging ? "ring-2 ring-accent" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        add(imageFilesFrom(e.dataTransfer.files));
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Listing screenshots</h2>
          <p className="text-sm text-ink-3">The ad as you saw it, even after it's taken down</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} loading={upload.isPending}>
          <ImagePlus className="size-4" aria-hidden /> Add
        </Button>
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

      {screenshots.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-4 text-sm text-ink-2 transition hover:border-ink-3 hover:text-ink"
        >
          <ImagePlus className="size-4" aria-hidden />
          Paste, drop or choose a screenshot of the job ad
        </button>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {screenshots.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setViewing(i)}
                className="group block w-full overflow-hidden rounded-xl border border-line bg-surface-2 transition hover:border-line-strong"
                aria-label={`Open screenshot ${i + 1}`}
              >
                {urls[s.file_path] ? (
                  <img
                    src={urls[s.file_path]}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <span className="flex aspect-[4/3] items-center justify-center">
                    {isLoading && <LoaderCircle className="size-5 animate-spin text-ink-3" aria-hidden />}
                  </span>
                )}
              </button>
            </li>
          ))}
          {upload.isPending && (
            <li className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-line-strong">
              <LoaderCircle className="size-5 animate-spin text-ink-3" aria-label="Uploading" />
            </li>
          )}
        </ul>
      )}

      <Lightbox
        open={current != null}
        onClose={() => setViewing(null)}
        index={viewing ?? 0}
        count={screenshots.length}
        src={current ? urls[current.file_path] : undefined}
        onNavigate={(i) => setViewing(i)}
        onDelete={() => current && setDeleting(current)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title="Delete this screenshot?"
        description="It will be permanently removed from this application."
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting, {
            onSuccess: () => {
              setDeleting(null);
              setViewing(null);
              toast.success("Screenshot deleted");
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </section>
  );
}

function Lightbox({
  open,
  onClose,
  index,
  count,
  src,
  onNavigate,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  index: number;
  count: number;
  src?: string;
  onNavigate: (i: number) => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    if (!open || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onNavigate((index + 1) % count);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, count, onNavigate]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={count > 1 ? `Screenshot ${index + 1} of ${count}` : "Screenshot"}
      size="xl"
      footer={
        <>
          <Button variant="dangerGhost" onClick={onDelete} className="sm:mr-auto">
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
          {src && (
            <a href={src} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
              <ExternalLink className="size-4" aria-hidden /> Open full size
            </a>
          )}
          {count > 1 && (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => onNavigate((index - 1 + count) % count)} aria-label="Previous">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => onNavigate((index + 1) % count)} aria-label="Next">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      }
    >
      <div className="flex min-h-48 items-center justify-center rounded-xl bg-surface-2">
        {src ? (
          <img src={src} alt={`Job listing screenshot ${index + 1}`} className="max-h-[68dvh] w-auto max-w-full rounded-lg" />
        ) : (
          <LoaderCircle className="size-5 animate-spin text-ink-3" aria-label="Loading" />
        )}
      </div>
    </Modal>
  );
}
