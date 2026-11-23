// Use-Case 2 · Vorrat Ebene 2 (UX-Konzept §8.3, DATENKATALOG `getFoodTypeLevel`): die
// Lebensmittelarten einer Warengruppe, gegliedert nach Kategorie (Zwischenüberschrift mit Summe).
// Produkte ohne Lebensmittelart stehen als eigene Zeile unter ihrer Kategorie.
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import type { StockGroup } from '../domain/stock-entry'
import type { FoodTypeLevel } from '../schemas'
import { loadReadContext, totalsByNode, totalsOf, type NotFound } from './read-context'
import { categoriesOf } from './stock-categories'
import type { StockReader } from './stock-reader'
import { joinUnits } from './stock-model'
import { buildRows } from './stock-rows'

interface FoodTypeLevelInput {
  householdId: string
  today: CalendarDay
  groupKey: string
}

async function findGroup(reader: StockReader, groupKey: string): Promise<StockGroup | null> {
  const groups = await reader.loadGroups()
  return groups.find((group) => group.key === groupKey) ?? null
}

export async function getFoodTypeLevel(
  reader: StockReader,
  { householdId, today, groupKey }: FoodTypeLevelInput,
): Promise<Result<FoodTypeLevel, NotFound>> {
  const group = await findGroup(reader, groupKey)
  if (group === null) return err({ kind: 'not-found' })
  const [context, products] = await Promise.all([
    loadReadContext(reader, householdId, today),
    reader.loadProducts(householdId, { groupKey }),
  ])
  const productIds = products.map((product) => product.id)
  const stock = await reader.loadUnits(householdId, { productIds, statuses: ['stock'] })
  const units = joinUnits(stock, products)
  const rows = buildRows({ context, products, stockUnits: units })
  const groupTotals = totalsByNode(context, units, [{ level: 'group', key: groupKey }])
  return ok({
    group: { ...group, totals: totalsOf(groupTotals, { level: 'group', key: groupKey }) },
    categories: categoriesOf(context, rows, units),
  })
}
