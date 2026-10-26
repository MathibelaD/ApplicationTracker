import { CalendarClock, ClipboardList, Hourglass } from "lucide-react";
import { agendaLabel, isOverdue, type AgendaItem } from "../lib/agenda";
import { daysUntil } from "../lib/format";

const ICONS = { closing: Hourglass, assignment: ClipboardList, stage: CalendarClock };

export function NextUpChip({ item }: { item: AgendaItem }) {
  const Icon = ICONS[item.kind];
  const overdue = isOverdue(item);
  const soon = !overdue && daysUntil(item.date) <= 2;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${
        overdue
          ? "bg-danger-soft text-danger"
          : soon
            ? "bg-warn-soft text-warn"
            : "bg-surface-2 text-ink-2"
      }`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{agendaLabel(item)}</span>
    </span>
  );
}
