// Meldungen, wenn sich ein eingetipptes MHD nicht lesen lässt (#53). Gleich beim Erfassen und
// beim Ändern eines Datums (#49). Es wird nie ein Datum geraten, die App fragt nach.
import type { DateKind } from '@/features/inventory/domain/unit'
import type { BestBeforeParseError } from '../domain/best-before'
import type { BestBeforeDoubt } from '../domain/best-before-plausibility'
import { dateEntryKey, dateEntryLabel, type DateEntry } from '../domain/date-entries'

export const PARSE_MESSAGES: Record<BestBeforeParseError['kind'], string> = {
  empty: 'Bitte gebt das Datum ein, wie es aufgedruckt ist, oder wählt „Datum fehlt“.',
  'no-date': 'Das ist kein Datum. Bitte so eingeben: 30.09.2027, 09/2027 oder 2027.',
  incomplete: 'Bitte mit Jahr eingeben, z. B. 30.09.2027.',
  ambiguous: 'Bitte das Jahr vierstellig eingeben, z. B. 09/2027.',
  'invalid-month': 'Diesen Monat gibt es nicht. Bitte prüft das Datum.',
  'invalid-date': 'Diesen Tag gibt es nicht. Bitte prüft das Datum.',
  'year-out-of-range': 'Bitte ein Jahr zwischen 2000 und 2099 eingeben.',
}

// Leise Rückfrage nach dem Hinzufügen, das Datum bleibt trotzdem in der Liste (#218)
const DOUBT_MESSAGES: Record<BestBeforeDoubt, string> = {
  'in-past': 'Das Datum liegt schon zurück, stimmt das?',
  'far-future': 'Das Datum liegt sehr weit in der Zukunft, stimmt das?',
}

/** „zu verbrauchen bis“ mitgetippt (#294): Die Zeile gilt als Verbrauchsdatum, ohne „Noch gut“. */
const USE_BY_NOTE = 'Verbrauchsdatum erkannt. Nach diesem Datum bitte nicht mehr essen.'

interface AddedDate {
  doubt: BestBeforeDoubt | null
  kind: DateKind | null
}

/** Satz unter dem Feld nach dem Hinzufügen: erkannte Datumsart und Rückfrage, sonst leer. */
export function addedDateNote({ doubt, kind }: AddedDate): string {
  const notes = [
    kind === 'use-by' ? USE_BY_NOTE : null,
    doubt === null ? null : DOUBT_MESSAGES[doubt],
  ]
  return notes.filter((note) => note !== null).join(' ')
}

/**
 * Satz nach dem Umschalten der Datumsart (#294). Gab es das Datum mit der neuen Art schon, wurden
 * beide Einträge einer: Das wird angesagt, denn eine Zeile verschwindet. Sonst leer.
 */
export function kindChangedNote(entries: readonly DateEntry[], key: string, isMerged: boolean) {
  const merged = isMerged ? entries.find((entry) => dateEntryKey(entry) === key) : undefined
  if (merged === undefined) return ''
  return `Zusammengeführt mit ${dateEntryLabel(merged)}, jetzt ${String(merged.count)}×.`
}
