// Use-Case 5 · Filter und Suche (UX-Konzept §8.3 Treffermodus, DATENKATALOG `searchStock`):
// flache Liste der Lebensmittelarten, gegliedert nach Warengruppe, mit Zählern je Zustand.
// Suche, Warengruppe, Kategorie, Behälter und Lagerort filtert die Datenbank, den Zustand
// (berechnet, nie gespeichert) die Fachlogik. Verbraucht und Entsorgt zeigt der Verlauf (#48).
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import { incompleteReasonCounts } from '../domain/incomplete'
import { countByStatusFilter, matchesStatusFilter } from '../domain/stock-filter'
import type { StockProduct } from '../domain/stock-entry'
import type { StockFilter } from '../schemas/requests'
import type { StockSearch } from '../schemas/stock'
import { loadReadContext, type ReadContext } from './read-context'
import type { StockReader } from './stock-reader'
import { joinUnits, rowKeyOf, toFilterableUnit, type JoinedUnit } from './stock-model'
import { buildRows, groupByKey } from './stock-rows'

interface SearchInput {
  householdId: string
  today: CalendarDay
  filter: StockFilter
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
  const stockByRow = groupByKey(data.stock, ({ product }) => rowKeyOf(product))
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
          incomplete: incompleteReasonCounts((stockByRow.get(key) ?? []).map(toFilterableUnit)),
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
  const matching = stock.filter((entry) =>
    matchesStatusFilter(toFilterableUnit(entry), filter.status, context),
  )
  const counts = countByStatusFilter(stock.map(toFilterableUnit), context)
  return { counts, groups: groupsOf(context, { products, stock, matching }), options }
}
