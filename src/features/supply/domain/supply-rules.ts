import type { StockUnit } from '@/features/inventory/domain/unit'
import type { CalendarDay } from '@/shared/lib/dates'

/**
 * Vorläufige Annahme U11 (W12, L9): Eine als „Noch gut“ geprüfte, abgelaufene Einheit zählt
 * nicht zu „versorgt“, wie im Prototyp. Eine andere Antwort ändert nur diesen Wert.
 */
export const STILL_GOOD_COUNTS_AS_SUPPLIED = false

/** Vorläufige Annahme U11: Kennzahlen werden auf eine Nachkommastelle abgerundet. */
const SUPPLY_DAYS_FACTOR = 10
// Gleitkomma-Rauschen wie 0,7 × 10 = 6,9999… darf nicht eine ganze Stelle kosten
const ROUNDING_EPSILON = 1e-9

export type CountableUnit = Pick<StockUnit, 'status' | 'bestBefore' | 'checkedAt'>

/** Zählt die Einheit am Stichtag? Nur im Vorrat und am Stichtag noch haltbar (MHD ≥ Stichtag). */
export function isCountedOn(
  unit: CountableUnit,
  referenceDay: CalendarDay,
  stillGoodCounts = STILL_GOOD_COUNTS_AS_SUPPLIED,
): boolean {
  if (unit.status !== 'stock') return false
  if (unit.bestBefore.date >= referenceDay) return true
  return stillGoodCounts && unit.checkedAt !== null
}

/** Rundet Tage auf eine Nachkommastelle ab, damit die App nie mehr verspricht als da ist. */
export function roundDownDays(days: number): number {
  return Math.floor(days * SUPPLY_DAYS_FACTOR + ROUNDING_EPSILON) / SUPPLY_DAYS_FACTOR
}
