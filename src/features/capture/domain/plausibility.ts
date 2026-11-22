import type { BestBefore } from '@/features/inventory/domain/unit'
import { addMonths, daysBetween, type CalendarDay } from '@/shared/lib/dates'

/** Sicherheit, die die KI zu ihrem Vorschlag angibt (Schema C). */
export type Confidence = 'high' | 'medium' | 'low'

type ReviewReason = 'in-past' | 'far-from-typical' | 'too-far-ahead' | 'low-confidence'

/** Ein MHD-Chip: nicht lesbar (gelb, kein Datum), passt, oder „bitte prüfen“ mit Gründen. */
export type BestBeforeSuggestion =
  | { status: 'unreadable' }
  | { status: 'ok'; bestBefore: BestBefore }
  | { status: 'review'; bestBefore: BestBefore; reasons: ReviewReason[] }

/**
 * Eigene Annahme (nicht im Konzept beziffert): „weit weg vom üblichen Wert der Kategorie“ heißt,
 * das MHD liegt mehr als doppelt so weit in der Zukunft wie die übliche Haltbarkeit.
 * Kürzere Restlaufzeiten sind normal (ältere Ware) und werden nicht markiert.
 */
const FAR_FROM_TYPICAL_FACTOR = 2

/** Ein MHD mehr als so viele Jahre in der Zukunft ist immer „bitte prüfen“, auch ohne Kategoriewert. */
const MAX_BEST_BEFORE_YEARS_AHEAD = 15
const MONTHS_PER_YEAR = 12

interface AssessInput {
  /** Erkanntes oder eingegebenes MHD, null wenn nicht lesbar */
  bestBefore: BestBefore | null
  confidence: Confidence | null
  today: CalendarDay
  /** Übliche Haltbarkeit der Kategorie in Tagen, null wenn unbekannt */
  typicalShelfLifeDays: number | null
}

function isFarFromTypical(daysLeft: number, typicalShelfLifeDays: number | null): boolean {
  if (typicalShelfLifeDays === null || typicalShelfLifeDays <= 0) return false
  return daysLeft > typicalShelfLifeDays * FAR_FROM_TYPICAL_FACTOR
}

function reviewReasons(input: AssessInput & { bestBefore: BestBefore }): ReviewReason[] {
  const daysLeft = daysBetween(input.today, input.bestBefore.date)
  const reasons: ReviewReason[] = []
  if (daysLeft < 0) reasons.push('in-past')
  if (isFarFromTypical(daysLeft, input.typicalShelfLifeDays)) reasons.push('far-from-typical')
  const latestPlausible = addMonths(input.today, MAX_BEST_BEFORE_YEARS_AHEAD * MONTHS_PER_YEAR)
  if (input.bestBefore.date > latestPlausible) reasons.push('too-far-ahead')
  if (input.confidence === 'low') reasons.push('low-confidence')
  return reasons
}

/** Prüft einen Vorschlag. Ohne Datum bleibt der Chip leer, es wird nie ein Datum ergänzt. */
export function assessBestBefore(input: AssessInput): BestBeforeSuggestion {
  const { bestBefore } = input
  if (bestBefore === null) return { status: 'unreadable' }
  const reasons = reviewReasons({ ...input, bestBefore })
  return reasons.length === 0
    ? { status: 'ok', bestBefore }
    : { status: 'review', bestBefore, reasons }
}
