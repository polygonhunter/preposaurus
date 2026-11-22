// Use-Case 3 · Detail einer Lebensmittelart (UX-Konzept §8.4, DATENKATALOG `getFoodTypeDetail`):
// Produkte mit Nährwerten und deren Herkunft, Packungen nach Datum mit Zustand. Auch ohne Packung
// im Vorrat bleibt die Seite erreichbar. Ein Produkt ohne Lebensmittelart hat seine eigene Seite.
import 'server-only'
import { pickFifoUnit } from '../domain/fifo'
import type { ProductFilter, StockProduct } from '../domain/stock-entry'
import type { CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import type { FoodTypeDetail, StockTarget } from '../schemas'
import { bestBeforeGroupsOf, nutritionOf } from './detail-product'
import {
  loadReadContext,
  totalsByNode,
  totalsOf,
  type NotFound,
  type ReadContext,
} from './read-context'
import type { StockReader } from './stock-reader'
import { joinUnits, rowKeyOf, rowNameOf, type JoinedUnit } from './stock-model'
import { groupByKey } from './stock-rows'

interface DetailInput {
  householdId: string
  today: CalendarDay
  target: StockTarget
}

const filterFor = (target: StockTarget): ProductFilter =>
  target.kind === 'food-type' ? { foodTypeId: target.id } : { productId: target.id }

function productsOf(
  context: ReadContext,
  products: readonly StockProduct[],
  units: readonly JoinedUnit[],
): FoodTypeDetail['products'] {
  const nodes = products.map(({ id }) => ({ level: 'product' as const, key: id }))
  const totals = totalsByNode(context, units, nodes)
  const unitsByProduct = groupByKey(units, (entry) => entry.product.id)
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    content: product.content,
    container: product.container,
    storageLocation: product.storageLocation,
    nutrition: nutritionOf(product),
    totals: totalsOf(totals, { level: 'product', key: product.id }),
    bestBeforeGroups: bestBeforeGroupsOf(
      (unitsByProduct.get(product.id) ?? []).map(({ unit }) => unit),
      context,
    ),
  }))
}

export async function getFoodTypeDetail(
  reader: StockReader,
  { householdId, today, target }: DetailInput,
): Promise<Result<FoodTypeDetail, NotFound>> {
  const products = await reader.loadProducts(householdId, filterFor(target))
  const [first] = products
  if (first === undefined) return err({ kind: 'not-found' })
  const productIds = products.map((product) => product.id)
  const [context, stock] = await Promise.all([
    loadReadContext(reader, householdId, today),
    reader.loadUnits(householdId, { productIds, statuses: ['stock'] }),
  ])
  const units = joinUnits(stock, products)
  const node = { level: 'foodType' as const, key: rowKeyOf(first) }
  const totals = totalsByNode(context, units, [node])
  return ok({
    target,
    name: rowNameOf(first),
    path: { group: first.group, category: first.category },
    typicalShelfLifeMonths: first.foodType?.typicalShelfLifeMonths ?? null,
    totals: totalsOf(totals, node),
    fifoUnitId: pickFifoUnit(stock)?.id ?? null,
    products: productsOf(context, products, units),
  })
}
