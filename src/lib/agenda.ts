import { daysUntil, formatTime, parseDateOnly, relativeDay } from "./format";
import type { ApplicationWithRelations } from "./types";

export type AgendaKind = "closing" | "assignment" | "stage";

export interface AgendaItem {
  id: string;
  kind: AgendaKind;
  date: Date;
  /** Closing dates have no time of day. */
  allDay: boolean;
  title: string;
  link: string | null;
  application: ApplicationWithRelations;
}

const CLOSED = new Set(["rejected", "withdrawn"]);

/** Everything with a date the user should act on, soonest first. */
export function buildAgenda(applications: ApplicationWithRelations[]): AgendaItem[] {
  const items: AgendaItem[] = [];
  const now = Date.now();

  for (const app of applications) {
    if (CLOSED.has(app.status)) continue;

    // A closing date only matters while you still need to apply.
    if (app.closing_date && app.status === "wishlist" && daysUntil(app.closing_date) >= 0) {
      items.push({
        id: `closing-${app.id}`,
        kind: "closing",
        date: parseDateOnly(app.closing_date),
        allDay: true,
        title: "Applications close",
        link: app.job_url,
        application: app,
      });
    }

    for (const a of app.assignments) {
      if (a.status === "submitted" || !a.due_at) continue;
      items.push({
        id: `assignment-${a.id}`,
        kind: "assignment",
        date: new Date(a.due_at),
        allDay: false,
        title: a.title,
        link: a.link,
        application: app,
      });
    }

    for (const s of app.stages) {
      if (s.outcome !== "scheduled" || !s.scheduled_at) continue;
      // Keep interviews visible for a couple of hours after they start.
      if (new Date(s.scheduled_at).getTime() < now - 2 * 3_600_000) continue;
      items.push({
        id: `stage-${s.id}`,
        kind: "stage",
        date: new Date(s.scheduled_at),
        allDay: false,
        title: s.title,
        link: s.meeting_link,
        application: app,
      });
    }
  }

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function isOverdue(item: AgendaItem): boolean {
  return item.allDay ? daysUntil(item.date) < 0 : item.date.getTime() < Date.now();
}

/** The single most pressing upcoming item for one application, if any. */
export function nextUp(app: ApplicationWithRelations): AgendaItem | undefined {
  return buildAgenda([app])[0];
}

export function agendaLabel(item: AgendaItem): string {
  const when = relativeDay(item.date);
  const time = item.allDay ? "" : `, ${formatTime(item.date)}`;
  switch (item.kind) {
    case "closing":
      return daysUntil(item.date) === 0 ? "Closes today" : `Closes ${when}`;
    case "assignment":
      return isOverdue(item) ? `Overdue · ${item.title}` : `${item.title} due ${when}${time}`;
    case "stage":
      return `${item.title} ${when}${time}`;
  }
}
