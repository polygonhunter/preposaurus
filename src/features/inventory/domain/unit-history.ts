import { todayInBerlin, type CalendarDay } from '@/shared/lib/dates'
import type { BestBefore, UnitStatus } from './unit'

/** Eine Packung mit Entnahme oder „Noch gut“, so wie das Repository sie liefert (#48). */
export interface UnitHistoryRow {
  status: UnitStatus
  takenAt: Date | null
  /** Anzeigename; null, wenn niemand eingetragen ist */
  takenBy: string | null
  checkedAt: CalendarDay | null
  bestBefore: BestBefore | null
}

type HistoryEventKind = 'consumed' | 'discarded' | 'still-good'

/** Ein Eintrag im Verlauf: was, an welchem Tag (Berlin) und von wem. */
export interface HistoryEvent {
  kind: HistoryEventKind
  day: CalendarDay
  /** Wer geprüft hat, speichert die Datenbank nicht: bei „Noch gut“ immer null */
  person: string | null
  bestBefore: BestBefore | null
}

function eventsOf(row: UnitHistoryRow): HistoryEvent[] {
  const events: HistoryEvent[] = []
  const { bestBefore } = row
  if (row.status !== 'stock' && row.takenAt !== null) {
    const day = todayInBerlin(row.takenAt)
    events.push({ kind: row.status, day, person: row.takenBy, bestBefore })
  }
  if (row.checkedAt !== null) {
    events.push({ kind: 'still-good', day: row.checkedAt, person: null, bestBefore })
  }
  return events
}

/**
 * Verlauf je Lebensmittelart: Eine Packung kann zweimal vorkommen (erst „Noch gut“, später
 * verbraucht). Neueste Tage zuerst, am selben Tag die Entnahme vor der Prüfung.
 */
export function historyEventsOf(rows: readonly UnitHistoryRow[], limit: number): HistoryEvent[] {
  return rows
    .flatMap(eventsOf)
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, limit)
}
