// Zweitversuch beim MHD (#114, DATENKATALOG §8.3): Meldet die KI Sicherheit „niedrig“ oder kein
// Datum, folgt ein zweiter Versuch mit dem stärkeren Modell. Beide Antworten sind Vorschläge,
// keine wird ergänzt. Ein Widerspruch zwischen zwei Daten bleibt sichtbar.
import { parseCalendarDay } from '@/shared/lib/dates'
import type { AiBestBeforeAnswer } from './ai-answers'

/** Gültiges Datum der Antwort als JJJJ-MM-TT, sonst null. */
const dateOf = (answer: AiBestBeforeAnswer) =>
  answer.datum === null ? null : parseCalendarDay(answer.datum.trim())

export function needsSecondAttempt(answer: AiBestBeforeAnswer): boolean {
  return answer.sicherheit === 'niedrig' || dateOf(answer) === null
}

export interface MergedBestBefore {
  /** Die geltende Antwort. Bei Widerspruch oder nur unsicherem Datum mit Sicherheit „niedrig“ */
  answer: AiBestBeforeAnswer
  /** Datum aus Versuch 1, wenn es dem Datum aus Versuch 2 widerspricht */
  conflictingDate: string | null
}

const toReview = (answer: AiBestBeforeAnswer): AiBestBeforeAnswer => ({
  ...answer,
  sicherheit: 'niedrig',
})

function mergeBoth(first: AiBestBeforeAnswer, second: AiBestBeforeAnswer): MergedBestBefore {
  const firstDate = dateOf(first)
  const secondDate = dateOf(second)
  if (secondDate === null && firstDate !== null) {
    return { answer: toReview(first), conflictingDate: null }
  }
  const isConflict = firstDate !== null && secondDate !== null && firstDate !== secondDate
  if (!isConflict) return { answer: second, conflictingDate: null }
  return { answer: toReview(second), conflictingDate: firstDate }
}

/**
 * Führt beide Versuche zusammen. `null` heißt: Der Versuch ist gescheitert (Fehler oder
 * Schema-Verstoß). Es gilt Versuch 2, sobald er ein Datum hat. Hat nur Versuch 1 ein Datum,
 * gilt es als „bitte prüfen“. Widersprechen sich zwei Daten, gilt Versuch 2 als „bitte prüfen“,
 * und das Datum aus Versuch 1 bleibt erhalten. Sind beide gescheitert, ergibt das null.
 */
export function mergeAttempts(
  first: AiBestBeforeAnswer | null,
  second: AiBestBeforeAnswer | null,
): MergedBestBefore | null {
  if (first !== null && second !== null) return mergeBoth(first, second)
  const only = second ?? first
  if (only === null) return null
  const isUnsureDate = only === first && dateOf(only) !== null
  return { answer: isUnsureDate ? toReview(only) : only, conflictingDate: null }
}
