// Zeilen im Vorrat (Ebene 2 und Treffermodus): je Lebensmittelart eine Zeile mit Summen,
// nächstem MHD, Zustand und Packungszahl. Ein Produkt ohne Art ist eine eigene Zeile.
import 'server-only'
import { mostUrgentState } from '../domain/stock-filter'
import type { StockProduct } from '../domain/stock-entry'
import type { StockRowDto } from '../schemas/shared'
import { totalsByNode, totalsOf, type ReadContext } from './read-context'
import { rowKeyOf, rowNameOf, rowTargetOf, type JoinedUnit } from './stock-model'

interface RowsInput {
  context: ReadContext
  /** In Baum-Reihenfolge, wie das Repository sie liefert */
  products: readonly StockProduct[]
  /** Packungen im Vorrat dieser Produkte */
  stockUnits: readonly JoinedUnit[]
  /** Nur diese Zeilen. Ohne Angabe alle, die Packungen im Vorrat haben */
  include?: ReadonlySet<string> | undefined
}

export interface BuiltRow {
  key: string
  product: StockProduct
  row: StockRowDto
}

export function groupByKey<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const existing = groups.get(key)
    if (existing) existing.push(item)
    else groups.set(key, [item])
  }
  return groups
}

/** Erstes Produkt je Zeile, in der Reihenfolge der Produkte. */
function firstProductPerRow(products: readonly StockProduct[]): Map<string, StockProduct> {
  const rows = new Map<string, StockProduct>()
  for (const product of products) {
    const key = rowKeyOf(product)
    if (!rows.has(key)) rows.set(key, product)
  }
  return rows
}

export function buildRows({ context, products, stockUnits, include }: RowsInput): BuiltRow[] {
  const unitsByRow = groupByKey(stockUnits, ({ product }) => rowKeyOf(product))
  const keys = [...firstProductPerRow(products)].filter(([key]) =>
    include === undefined ? unitsByRow.has(key) : include.has(key),
  )
  const nodes = keys.map(([key]) => ({ level: 'foodType' as const, key }))
  const totals = totalsByNode(context, stockUnits, nodes)
  return keys.map(([key, product]) => {
    const units = unitsByRow.get(key) ?? []
    return {
      key,
      product,
      row: {
        target: rowTargetOf(product),
        name: rowNameOf(product),
        pictogram: product.category.pictogram,
        packagesInStock: units.length,
        state: mostUrgentState(
          units.map(({ unit }) => unit),
          context,
        ),
        totals: totalsOf(totals, { level: 'foodType', key }),
      },
    }
  })
}
