import type { CalendarDay } from '@/shared/lib/dates'
import { incompleteReasonsOf, type IncompleteCheck } from './incomplete'
import { timeGroupFor } from './time-group'
import { unitStateFor, type AmpelThresholds, type UnitState } from './unit-state'
import type { StockUnit } from './unit'

// Zustands-Filter im Vorrat (UX-Konzept §8.3, #43). Der Filter ist ein Parameter, damit die
// Design-Freigabe (D7, #119) „Verbraucht“ und „Entsorgt“ in einen Verlauf verlegen kann, ohne
// Umbau. Die Oberfläche zeigt davon, was sie braucht.

/**
 * Gespiegelt in `stockFilterSchema` (inventory/schemas/requests.ts). Ein Typtest in search-stock.test.ts
 * hält beide deckungsgleich (CODE_PRINZIPIEN §7).
 */
export type StockStatusFilter =
  'in-stock' | 'due-soon' | 'expired' | 'incomplete' | 'consumed' | 'discarded'

/** Filter über den Packungen im Vorrat, nur sie stehen als Chips über der Liste. */
export type InStockStatusFilter = Exclude<StockStatusFilter, 'consumed' | 'discarded'>

export type FilterableUnit = IncompleteCheck & Pick<StockUnit, 'checkedAt'>

export interface StateContext {
  today: CalendarDay
  thresholds: AmpelThresholds
}

/**
 * Ampel einer Packung für die Anzeige. Eine abgelaufene, „Noch gut“ geprüfte Packung ist
 * entschieden und gilt als gut, sie verlässt „Abgelaufen“ (UX-Konzept §8.2).
 */
export function displayStateOf(
  unit: Pick<StockUnit, 'bestBefore' | 'checkedAt'>,
  { today, thresholds }: StateContext,
): UnitState {
  const state = unitStateFor({ bestBefore: unit.bestBefore?.date ?? null, today, thresholds })
  return state === 'expired' && unit.checkedAt !== null ? 'good' : state
}

const isInStock = (unit: FilterableUnit) => unit.status === 'stock'

const isDueSoon = (unit: FilterableUnit, context: StateContext) => {
  const state = displayStateOf(unit, context)
  return isInStock(unit) && (state === 'soon' || state === 'urgent')
}

const STATUS_PREDICATES: Record<
  StockStatusFilter,
  (unit: FilterableUnit, context: StateContext) => boolean
> = {
  'in-stock': isInStock,
  'due-soon': isDueSoon,
  // Wie die Gruppe „Abgelaufen“ auf Bald fällig: „Noch gut“ geprüfte Packungen sind entschieden
  expired: (unit, { today, thresholds }) => timeGroupFor(unit, today, thresholds) === 'expired',
  incomplete: (unit) => incompleteReasonsOf(unit).length > 0,
  consumed: (unit) => unit.status === 'consumed',
  discarded: (unit) => unit.status === 'discarded',
}

export function matchesStatusFilter(
  unit: FilterableUnit,
  filter: StockStatusFilter,
  context: StateContext,
): boolean {
  return STATUS_PREDICATES[filter](unit, context)
}

/**
 * Zähler je Filter im Vorrat, gezählt in Packungen. Alle aus denselben geladenen Packungen, keine
 * Abfrage je Chip (#221).
 */
export function countByStatusFilter(
  units: readonly FilterableUnit[],
  context: StateContext,
): Record<InStockStatusFilter, number> {
  const counts: Record<InStockStatusFilter, number> = {
    'in-stock': 0,
    'due-soon': 0,
    expired: 0,
    incomplete: 0,
  }
  for (const filter of Object.keys(counts) as InStockStatusFilter[]) {
    counts[filter] = units.filter((unit) => matchesStatusFilter(unit, filter, context)).length
  }
  return counts
}

const URGENCY: Record<UnitState, number> = {
  'no-date': 0,
  good: 1,
  soon: 2,
  urgent: 3,
  expired: 4,
}

/**
 * Zustandswort einer Zeile: die dringendste Packung im Vorrat. „Datum fehlt“ steht nur, wenn
 * keine Packung ein Datum hat. Ohne Packung im Vorrat null.
 */
export function mostUrgentState(
  units: readonly Pick<StockUnit, 'status' | 'bestBefore' | 'checkedAt'>[],
  context: StateContext,
): UnitState | null {
  let result: UnitState | null = null
  for (const unit of units) {
    if (unit.status !== 'stock') continue
    const state = displayStateOf(unit, context)
    if (result === null || URGENCY[state] > URGENCY[result]) result = state
  }
  return result
}
