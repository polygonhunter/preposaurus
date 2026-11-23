// Kategorien einer Warengruppe mit Summe und Zeilen (Ebene 2), für eine Gruppe (`getFoodTypeLevel`)
// und für alle auf einmal (`getStockTree`, M12-03).
import 'server-only'
import type { StockCategory } from '../domain/stock-entry'
import type { StockRowDto } from '../schemas/shared'
import type { FoodTypeLevel } from '../schemas/stock'
import { totalsByNode, totalsOf, type ReadContext } from './read-context'
import type { JoinedUnit } from './stock-model'
import type { BuiltRow } from './stock-rows'

function rowsByCategory(rows: readonly BuiltRow[]) {
  const byCategory = new Map<string, { category: StockCategory; rows: StockRowDto[] }>()
  for (const { product, row } of rows) {
    const entry = byCategory.get(product.category.id)
    if (entry) entry.rows.push(row)
    else byCategory.set(product.category.id, { category: product.category, rows: [row] })
  }
  return byCategory
}

/** Zeilen nach Kategorie in Baum-Reihenfolge, je Kategorie die Summen ihrer Packungen. */
export function categoriesOf(
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
