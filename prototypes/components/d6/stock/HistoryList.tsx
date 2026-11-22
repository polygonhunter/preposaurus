import { getCategory } from "@/lib/categories";
import type { HistoryEntry, UnitOutcome } from "@/lib/unit-history";
import { formatShortDate } from "../data/format";
import { MONO } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";

const EMPTY_TEXT: Record<UnitOutcome, string> = {
  verbraucht: "Noch nichts verbraucht. Tippe an einer Einheit auf „Verbraucht“, dann landet sie hier.",
  entsorgt: "Nichts entsorgt – schön so.",
};

interface HistoryListProps {
  outcome: UnitOutcome;
  entries: HistoryEntry[];
}

/** Historie: Einheiten, die den Vorrat verlassen haben, mit Datum der Entscheidung. */
export function HistoryList({ outcome, entries }: HistoryListProps) {
  if (entries.length === 0) {
    return <p className="rounded-3xl bg-(--d6-glass) p-6 text-center text-sm text-(--d6-muted)">{EMPTY_TEXT[outcome]}</p>;
  }
  return (
    <GlassTile padding="p-2">
      <ul className="divide-y divide-(--d6-line)">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 px-2 py-2.5">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-(--d6-glass-strong) text-lg">
              {getCategory(entry.category).emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.productName}</p>
              <p className={`${MONO} text-[11px] text-(--d6-subtle)`}>MHD {formatShortDate(entry.mhd)}</p>
            </div>
            <span className={`${MONO} shrink-0 text-xs text-(--d6-muted)`}>
              {outcome} am {formatShortDate(entry.date)}
            </span>
          </li>
        ))}
      </ul>
    </GlassTile>
  );
}
