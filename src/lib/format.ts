// Formatting follows the visitor's locale (navigator.language) so dates,
// times and relative phrases read naturally wherever the app is used.

const DAY = 86_400_000;

/** Parses a YYYY-MM-DD string as a local calendar date. */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDateOnly(value) : new Date(value);
}

const dateFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

const weekdayFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const relFmt = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function formatDate(value: string | Date): string {
  return dateFmt.format(toDate(value));
}

/** Omits the year when it's the current one. */
export function formatDateCompact(value: string | Date): string {
  const d = toDate(value);
  return d.getFullYear() === new Date().getFullYear()
    ? shortDateFmt.format(d)
    : dateFmt.format(d);
}

export function formatWeekday(value: string | Date): string {
  return weekdayFmt.format(toDate(value));
}

export function formatTime(value: string | Date): string {
  return timeFmt.format(toDate(value));
}

export function formatDateTime(value: string | Date): string {
  const d = toDate(value);
  return `${formatWeekday(d)}, ${timeFmt.format(d)}`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole calendar days from today until `value` (negative = past). */
export function daysUntil(value: string | Date): number {
  return Math.round((startOfDay(toDate(value)) - startOfDay(new Date())) / DAY);
}

/** "today", "tomorrow", "in 3 days", "2 weeks ago" in the user's language. */
export function relativeDay(value: string | Date): string {
  const days = daysUntil(value);
  if (Math.abs(days) < 14) return relFmt.format(days, "day");
  if (Math.abs(days) < 60) return relFmt.format(Math.round(days / 7), "week");
  return relFmt.format(Math.round(days / 30), "month");
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Local date as YYYY-MM-DD for <input type="date">. */
export function toDateInputValue(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO timestamp → value for <input type="datetime-local">. */
export function toDateTimeInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toDateInputValue(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → ISO timestamp (or null). */
export function fromDateTimeInputValue(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Adds https:// when the user pastes a bare domain. */
export function normalizeUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
