import { addDays, addMonths, todayInBerlin, type CalendarDay } from '@/shared/lib/dates'
import type { BestBefore } from './unit'

// Verlauf als Unterseite des Vorrats (UX-Konzept §8.3 und D7, #48): verbrauchte und entsorgte
// Packungen mit Tag und Person, wählbar nach Zeitraum. Gezählt und gruppiert wird in Berlin.

/** Gespiegelt in `HISTORY_OUTCOMES` (inventory/schemas/history.ts), Typtest in get-history.test.ts. */
export type HistoryOutcome = 'consumed' | 'discarded'

/** Gespiegelt in `HISTORY_PERIODS` (inventory/schemas/history.ts), Typtest in get-history.test.ts. */
export type HistoryPeriod = '30-days' | '3-months' | '12-months' | 'all'

/** Eine entnommene Packung, so wie das Repository sie liefert (neueste zuerst). */
export interface TakenOutUnit {
  id: string
  productId: string
  outcome: HistoryOutcome
  takenAt: Date
  /** Anzeigename; null, wenn niemand eingetragen ist */
  takenBy: string | null
  bestBefore: BestBefore | null
}

const DAYS_IN_SHORT_PERIOD = 30

/**
 * Erster Tag des Zeitraums, heute eingeschlossen: „30 Tage“ sind heute und die 29 Tage davor,
 * „3 Monate“ beginnen am Tag nach demselben Tag vor drei Monaten. „Alles“ hat keinen Anfang.
 */
export function periodStartDay(period: HistoryPeriod, today: CalendarDay): CalendarDay | null {
  switch (period) {
    case '30-days':
      return addDays(today, 1 - DAYS_IN_SHORT_PERIOD)
    case '3-months':
      return addDays(addMonths(today, -3), 1)
    case '12-months':
      return addDays(addMonths(today, -12), 1)
    case 'all':
      return null
  }
}

export interface HistoryDay<T> {
  day: CalendarDay
  items: T[]
}

/**
 * Bündelt nach Tag (Berlin) in der Reihenfolge der Eingabe. Eine Entnahme kurz nach Mitternacht
 * zählt zum neuen Tag, auch wenn es in UTC noch der Vortag ist.
 */
export function groupByBerlinDay<T extends Pick<TakenOutUnit, 'takenAt'>>(
  items: readonly T[],
): HistoryDay<T>[] {
  const days: HistoryDay<T>[] = []
  for (const item of items) {
    const day = todayInBerlin(item.takenAt)
    const last = days.at(-1)
    if (last?.day === day) last.items.push(item)
    else days.push({ day, items: [item] })
  }
  return days
}
