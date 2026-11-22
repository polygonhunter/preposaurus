// Use-Case 2 · Vorrat Ebene 2 (UX-Konzept §8.3, DATENKATALOG `getFoodTypeLevel`): die
// Lebensmittelarten einer Warengruppe, gegliedert nach Kategorie (Zwischenüberschrift mit Summe).
// Produkte ohne Lebensmittelart stehen als eigene Zeile unter ihrer Kategorie.
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import type { StockCategory, StockGroup } from '../domain/stock-entry'
import type { FoodTypeLevel, StockRowDto } from '../schemas'
import {
  loadReadContext,
  totalsByNode,
  totalsOf,
  type NotFound,
  type ReadContext,
} from './read-context'
import type { StockReader } from './stock-reader'
import { joinUnits, type JoinedUnit } from './stock-model'
import { buildRows, type BuiltRow } from './stock-rows'

interface FoodTypeLevelInput {
  householdId: string
  today: CalendarDay
  groupKey: string
}

function rowsByCategory(rows: readonly BuiltRow[]) {
  const byCategory = new Map<string, { category: StockCategory; rows: StockRowDto[] }>()
  for (const { product, row } of rows) {
    const entry = byCategory.get(product.category.id)
    if (entry) entry.rows.push(row)
    else byCategory.set(product.category.id, { category: product.category, rows: [row] })
  }
  return byCategory
}

function categoriesOf(
  context: ReadContext,
  rows: readonly BuiltRow[],
  units: readonly JoinedUnit[],
): FoodTypeLevel['categories'] {
  const byCategory = rowsByCategory(rows)
  const nodes = [...byCategory.keys()].map((key) => ({ level: 'category' as const, key }))
  const totals = totalsByNode(context, units, nodes)
  return [...byCategory.values()].map(({ category, rows: categoryRows }) => ({
    ...category,
    totals: totalsOf(totals, { level: 'category', key: category.id }),
    rows: categoryRows,
  }))
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
