// MHD-Schätzung der KI ins Fach-Modell (#124). Nur auf ausdrückliche Wahl bei „Datum fehlt“.
// Die KI nennt eine Haltbarkeit ab heute in Monaten, nie ein Datum. Daraus rechnet die App das
// Monats- bzw. Jahresende und setzt immer das Kennzeichen „geschätzt“. Ein taggenaues Ergebnis
// gibt es nicht, damit eine Schätzung nie wie ein gelesenes Datum aussieht.
import type { BestBefore } from '@/features/inventory/domain/unit'
import { addMonths, endOfMonth, endOfYear, type CalendarDay } from '@/shared/lib/dates'
import type { AiBestBeforeEstimateAnswer } from './ai-answers'
import { mapConfidence } from './map-recognition'
import type { Confidence } from './plausibility'

/**
 * Eigene Annahme: Mehr als 30 Jahre Haltbarkeit schätzt die KI nicht sinnvoll (auch Notvorrat in
 * Dosen trägt höchstens wenige Jahre MHD). Darüber gilt die Antwort als „keine Schätzung“.
 */
const MAX_ESTIMATED_MONTHS = 360

export interface BestBeforeEstimate {
  /** null: Die KI konnte nicht sinnvoll schätzen, es bleibt „Datum fehlt“ */
  bestBefore: BestBefore | null
  confidence: Confidence
}

function usableMonths(months: number | null): number | null {
  if (months === null || !Number.isFinite(months)) return null
  const rounded = Math.round(months)
  return rounded >= 1 && rounded <= MAX_ESTIMATED_MONTHS ? rounded : null
}

export function mapBestBeforeEstimateAnswer(
  answer: AiBestBeforeEstimateAnswer,
  today: CalendarDay,
): BestBeforeEstimate {
  const confidence = mapConfidence(answer.sicherheit)
  const months = usableMonths(answer.haltbar_monate)
  if (months === null) return { bestBefore: null, confidence }
  const target = addMonths(today, months)
  const bestBefore: BestBefore =
    answer.genauigkeit === 'jahr'
      ? { date: endOfYear(target), precision: 'year', isEstimated: true }
      : { date: endOfMonth(target), precision: 'month', isEstimated: true }
  return { bestBefore, confidence }
}
