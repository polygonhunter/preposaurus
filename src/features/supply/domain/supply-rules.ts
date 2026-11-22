import type { StockUnit } from '@/features/inventory/domain/unit'
import type { CalendarDay } from '@/shared/lib/dates'

/**
 * Stichtag einer Rechnung. „Heute“ und „Zieldatum“ zählen verschieden: Am Zieldatum zählt eine
 * „Noch gut“ geprüfte Packung nie, auch wenn der Haushalt sie für heute mitzählen lässt (#117).
 */
export interface ReferenceDay {
  day: CalendarDay
  kind: 'today' | 'target'
}

/** Vorläufige Annahme U11: Kennzahlen werden auf eine Nachkommastelle abgerundet. */
const SUPPLY_DAYS_FACTOR = 10
// Gleitkomma-Rauschen wie 0,7 × 10 = 6,9999… darf nicht eine ganze Stelle kosten
const ROUNDING_EPSILON = 1e-9

export type CountableUnit = Pick<StockUnit, 'status' | 'bestBefore' | 'checkedAt'>

const countsAsStillGood = (
  unit: CountableUnit,
  reference: ReferenceDay,
  stillGoodCounts: boolean,
) => reference.kind === 'today' && stillGoodCounts && unit.checkedAt !== null

/**
 * Zählt die Einheit am Stichtag? Nur im Vorrat und am Stichtag noch haltbar (MHD ≥ Stichtag).
 * Ohne Datum zählt sie heute, am Zieldatum nicht.
 * `stillGoodCounts` ist die Haushalts-Einstellung „Noch gut zählt mit“ (#117). Sie ist Pflicht,
 * damit kein Aufrufer den Schalter still übergeht, und gilt nur für heute.
 */
export function isCountedOn(
  unit: CountableUnit,
  reference: ReferenceDay,
  stillGoodCounts: boolean,
): boolean {
  if (unit.status !== 'stock') return false
  // „Datum fehlt“: Die Packung ist da, aber niemand weiß, ob sie am Zieldatum noch hält (#116)
  if (unit.bestBefore === null) return reference.kind === 'today'
  if (unit.bestBefore.date >= reference.day) return true
  return countsAsStillGood(unit, reference, stillGoodCounts)
}

/** Rundet Tage auf eine Nachkommastelle ab, damit die App nie mehr verspricht als da ist. */
export function roundDownDays(days: number): number {
  return Math.floor(days * SUPPLY_DAYS_FACTOR + ROUNDING_EPSILON) / SUPPLY_DAYS_FACTOR
}
