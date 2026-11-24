// Use-Case Verlauf (#48, ROT-07, UX-Konzept D7, DATENKATALOG `getHistory(zeitraum, art?)`):
// verbrauchte und entsorgte Packungen des Haushalts mit Tag und Person, nach Zeitraum und auf
// Wunsch nur für eine Lebensmittelart. Die Zähler gelten für den Zeitraum, nicht für die Seite.
import 'server-only'
import { startOfDayInBerlin, type CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  groupByBerlinDay,
  periodStartDay,
  type HistoryOutcome,
  type TakenOutUnit,
} from '../domain/history'
import type { StockProduct } from '../domain/stock-entry'
import type { UnitStatus } from '../domain/unit'
import {
  HISTORY_PAGE_LIMIT,
  type HistoryFilter,
  type HistoryItem,
  type HistoryPage,
} from '../schemas/history'
import type { NotFound } from './read-context'
import type { StockReader } from './stock-reader'
import { productFilterFor, rowNameOf, rowTargetOf } from './stock-model'

const BOTH_OUTCOMES: readonly HistoryOutcome[] = ['consumed', 'discarded']

type Scope = Readonly<{ productIds?: readonly string[]; takenFrom: Date | null }>

/** Port: entnommene Packungen und ihre Anzahl, immer nur im eigenen Haushalt (#133). */
export interface TakenOutReader {
  loadTakenOutUnits: (
    householdId: string,
    query: Scope & Readonly<{ outcomes: readonly HistoryOutcome[]; limit: number }>,
  ) => Promise<TakenOutUnit[]>
  countUnitsByStatus: (householdId: string, query: Scope) => Promise<Record<UnitStatus, number>>
}

interface Ports {
  reader: Pick<StockReader, 'loadProducts'>
  history: TakenOutReader
}

interface HistoryInput {
  householdId: string
  today: CalendarDay
  filter: HistoryFilter
}

function toItems(units: readonly TakenOutUnit[], products: readonly StockProduct[]): HistoryItem[] {
  const byId = new Map(products.map((product) => [product.id, product]))
  return units.flatMap((unit) => {
    const product = byId.get(unit.productId)
    if (product === undefined) return []
    const { id: unitId, outcome, takenBy: person, bestBefore } = unit
    return [
      { unitId, outcome, target: rowTargetOf(product), name: product.name, person, bestBefore },
    ]
  })
}

function daysOf(units: readonly TakenOutUnit[], products: readonly StockProduct[]) {
  return groupByBerlinDay(units).map(({ day, items }) => ({ day, items: toItems(items, products) }))
}

/** Ein unbekanntes oder fremdes Ziel ergibt „nicht gefunden“, nicht einen leeren Verlauf. */
export async function getHistory(
  { reader, history }: Ports,
  { householdId, today, filter }: HistoryInput,
): Promise<Result<HistoryPage, NotFound>> {
  const { target, outcome } = filter
  const products = await reader.loadProducts(householdId, target ? productFilterFor(target) : {})
  const [first] = products
  if (target !== undefined && first === undefined) return err({ kind: 'not-found' })
  const from = periodStartDay(filter.period, today)
  const scope: Scope = {
    ...(target === undefined ? {} : { productIds: products.map((product) => product.id) }),
    takenFrom: from === null ? null : startOfDayInBerlin(from),
  }
  const outcomes = outcome === undefined ? BOTH_OUTCOMES : [outcome]
  const [units, counts] = await Promise.all([
    // Eine mehr laden, um zu wissen, ob es weitergeht
    history.loadTakenOutUnits(householdId, { ...scope, outcomes, limit: HISTORY_PAGE_LIMIT + 1 }),
    history.countUnitsByStatus(householdId, scope),
  ])
  return ok({
    target: target && first ? { target, name: rowNameOf(first) } : null,
    from,
    counts: { consumed: counts.consumed, discarded: counts.discarded },
    days: daysOf(units.slice(0, HISTORY_PAGE_LIMIT), products),
    isTruncated: units.length > HISTORY_PAGE_LIMIT,
  })
}
