// Use-Case 5 · Filter und Suche (UX-Konzept §8.3 Treffermodus, DATENKATALOG `searchStock`):
// flache Liste der Lebensmittelarten, gegliedert nach Warengruppe, mit Zählern je Zustand.
// Suche, Warengruppe, Kategorie, Behälter und Lagerort filtert die Datenbank, den Zustand
// (berechnet, nie gespeichert) die Fachlogik.
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import { countsAsIncomplete, nutritionGapOf } from '../domain/incomplete'
import {
  countByStatusFilter,
  matchesStatusFilter,
  type FilterableUnit,
  type StockStatusFilter,
} from '../domain/stock-filter'
import type { StockProduct } from '../domain/stock-entry'
import type { UnitStatus } from '../domain/unit'
import type { StockFilter } from '../schemas/requests'
import type { StockSearch } from '../schemas/stock'
import { loadReadContext, type ReadContext } from './read-context'
import type { StockReader } from './stock-reader'
import { joinUnits, rowKeyOf, type JoinedUnit } from './stock-model'
import { buildRows, groupByKey } from './stock-rows'

interface SearchInput {
  householdId: string
  today: CalendarDay
  filter: StockFilter
}

const TAKEN_OUT: Partial<Record<StockStatusFilter, UnitStatus>> = {
  consumed: 'consumed',
  discarded: 'discarded',
}

const toFilterable = ({ unit, product }: JoinedUnit): FilterableUnit => ({
  ...unit,
  hasNutritionGap: countsAsIncomplete(
    nutritionGapOf(product.nutrition, product.foodType?.reference ?? null),
  ),
})

/** Packungen, die zum Zustand passen. Verbraucht und Entsorgt werden eigens nachgeladen. */
async function matchingUnits(
  reader: StockReader,
  input: SearchInput & { products: readonly StockProduct[]; stock: readonly JoinedUnit[] },
  context: ReadContext,
): Promise<JoinedUnit[]> {
  const takenOut = TAKEN_OUT[input.filter.status]
  if (takenOut === undefined) {
    return input.stock.filter((entry) =>
      matchesStatusFilter(toFilterable(entry), input.filter.status, context),
    )
  }
  const productIds = input.products.map((product) => product.id)
  const units = await reader.loadUnits(input.householdId, { productIds, statuses: [takenOut] })
  return joinUnits(units, input.products)
}

async function countsFor(
  reader: StockReader,
  input: { householdId: string; products: readonly StockProduct[]; stock: readonly JoinedUnit[] },
  context: ReadContext,
): Promise<Record<StockStatusFilter, number>> {
  const productIds = input.products.map((product) => product.id)
  const taken = await reader.countUnitsByStatus(input.householdId, productIds)
  const counts = countByStatusFilter(input.stock.map(toFilterable), context)
  return { ...counts, consumed: taken.consumed, discarded: taken.discarded }
}

function groupsOf(
  context: ReadContext,
  data: {
    products: readonly StockProduct[]
    stock: readonly JoinedUnit[]
    matching: readonly JoinedUnit[]
  },
): StockSearch['groups'] {
  const matchingByRow = groupByKey(data.matching, ({ product }) => rowKeyOf(product))
  const rows = buildRows({
    context,
    products: data.products,
    stockUnits: data.stock,
    include: new Set(matchingByRow.keys()),
  })
  const byGroup = groupByKey(rows, ({ product }) => product.group.key)
  return [...byGroup.values()].flatMap((groupRows) => {
    const group = groupRows[0]?.product.group
    if (group === undefined) return []
    return [
      {
        ...group,
        rows: groupRows.map(({ key, row }) => ({
          ...row,
          matchingPackages: matchingByRow.get(key)?.length ?? 0,
        })),
      },
    ]
  })
}

export async function searchStock(reader: StockReader, input: SearchInput): Promise<StockSearch> {
  const { householdId, today, filter } = input
  const { search, groupKey, categoryId, containerId, storageLocationId } = filter
  const productFilter = { search, groupKey, categoryId, containerId, storageLocationId }
  const [context, products, options] = await Promise.all([
    loadReadContext(reader, householdId, today),
    reader.loadProducts(householdId, productFilter),
    reader.loadFilterOptions(householdId),
  ])
  const productIds = products.map((product) => product.id)
  const stockUnits = await reader.loadUnits(householdId, { productIds, statuses: ['stock'] })
  const stock = joinUnits(stockUnits, products)
  const data = { ...input, products, stock }
  const [counts, matching] = await Promise.all([
    countsFor(reader, data, context),
    matchingUnits(reader, data, context),
  ])
  return { counts, groups: groupsOf(context, { products, stock, matching }), options }
}
