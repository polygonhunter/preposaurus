// Leise Rückfrage bei auffälligen Daten (#218): Ein MHD in der Vergangenheit oder sehr weit in der
// Zukunft ist oft ein Tippfehler (2020 statt 2027, 2072 statt 2027). Gesperrt wird nichts, denn
// beides kann stimmen: eine schon abgelaufene Packung oder sehr lange haltbare Notvorrat-Kost.
import type { BestBefore } from '@/features/inventory/domain/unit'
import { addMonths, type CalendarDay } from '@/shared/lib/dates'

/**
 * Vorläufig: Ab 30 Jahren fragt die App nach. Die längsten MHD im Notvorrat (gefriergetrocknete
 * Langzeitkost) liegen bei etwa 25 Jahren (05_STATUS_ENTSCHEIDUNGEN.md).
 */
const FAR_FUTURE_MONTHS = 30 * 12

export type BestBeforeDoubt = 'in-past' | 'far-future'

/** Wirkt das Datum wie ein Tippfehler? null, wenn es unauffällig ist. */
export function doubtAboutBestBefore(
  bestBefore: Pick<BestBefore, 'date'>,
  today: CalendarDay,
): BestBeforeDoubt | null {
  if (bestBefore.date < today) return 'in-past'
  if (bestBefore.date > addMonths(today, FAR_FUTURE_MONTHS)) return 'far-future'
  return null
}
