import { ChevronLeft, ChevronRight } from "lucide-react";

/** Page numbers to show: first, last, and the current page's neighbours, with gaps as null. */
function pageItems(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  // Fill a gap of one page instead of showing "…" in its place.
  if (keep.has(3) && !keep.has(2)) keep.add(2);
  if (keep.has(pages - 2) && !keep.has(pages - 1)) keep.add(pages - 1);
  const sorted = [...keep].sort((a, b) => a - b);
  const items: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push(null);
    items.push(p);
  });
  return items;
}

const itemClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-medium tabular-nums transition disabled:pointer-events-none disabled:opacity-40";

export function Pagination({
  page,
  pages,
  onChange,
  className = "",
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (pages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${itemClass} gap-1 text-ink-2 hover:bg-surface-2 hover:text-ink`}
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="max-sm:sr-only">Previous</span>
      </button>

      {pageItems(page, pages).map((p, i) =>
        p == null ? (
          <span key={`gap${i}`} className="px-1 text-sm text-ink-3" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`${itemClass} ${
              p === page ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className={`${itemClass} gap-1 text-ink-2 hover:bg-surface-2 hover:text-ink`}
      >
        <span className="max-sm:sr-only">Next</span>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
