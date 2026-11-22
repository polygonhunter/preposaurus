// Brücke von den gelesenen Produkten und Einheiten zu den Eingaben der Fachlogik: Pfad im Baum,
// kcal und Makros je Packung (Richtwerte live über `resolveNutrition`, E-5), Wasser-Anteil.
import 'server-only'
import type { GroupUnit } from '@/features/supply/domain/group-progress'
import type { NodeUnit } from '@/features/supply/domain/node-totals'
import type { ContentQuantity } from '@/shared/lib/quantities'
import {
  hasEstimatedKcal,
  resolveNutrition,
  type ResolvedNutrition,
} from '../domain/resolve-nutrition'
import type { StockProduct, StockProductUnit } from '../domain/stock-entry'
import type { StockTarget } from '../schemas'

export interface JoinedUnit {
  unit: StockProductUnit
  product: StockProduct
}

const PER_100 = 100
// Schlüssel der Warengruppe Wasser (Seed warengruppen.ts). Nur ihre Packungen in ml zählen in die
// Wasser-Tage, andere Getränke nicht (UX-Konzept A10).
const WATER_GROUP_KEY = 'wasser'

/** Verknüpft Einheiten mit ihrem Produkt. Einheiten ohne geladenes Produkt fallen weg. */
export function joinUnits(
  units: readonly StockProductUnit[],
  products: readonly StockProduct[],
): JoinedUnit[] {
  const byId = new Map(products.map((product) => [product.id, product]))
  return units.flatMap((unit) => {
    const product = byId.get(unit.productId)
    return product === undefined ? [] : [{ unit, product }]
  })
}

/**
 * Zeile im Vorrat: die Lebensmittelart, ohne Art das Produkt selbst. Solange die Art optional ist
 * (Maintainer-Frage offen), steht ein Produkt ohne Art so direkt unter seiner Kategorie.
 */
export function rowTargetOf(product: StockProduct): StockTarget {
  return product.foodType === null
    ? { kind: 'product', id: product.id }
    : { kind: 'food-type', id: product.foodType.id }
}

export function rowKeyOf(product: StockProduct): string {
  const { kind, id } = rowTargetOf(product)
  return `${kind}:${id}`
}

export const rowNameOf = (product: StockProduct) => product.foodType?.name ?? product.name

/** Wert je Packung aus dem Wert je 100 g bzw. ml. Fehlt er, bleibt er null. */
export function perPackage(per100: number | null, content: ContentQuantity): number | null {
  return per100 === null ? null : (content.value * per100) / PER_100
}

export function resolvedNutritionOf(product: StockProduct): ResolvedNutrition {
  return resolveNutrition(product.nutrition, product.foodType?.reference ?? null)
}

const isWater = (product: StockProduct) =>
  product.group.key === WATER_GROUP_KEY && product.content.unit === 'ml'

export function toNodeUnit({ unit, product }: JoinedUnit): NodeUnit {
  const resolved = resolvedNutritionOf(product)
  const { content } = product
  return {
    id: unit.id,
    status: unit.status,
    bestBefore: unit.bestBefore,
    checkedAt: unit.checkedAt,
    // Fehlen kcal auch im Richtwert, zählt die Packung mit 0 (UX-Konzept §4)
    kcal: perPackage(resolved.kcal.value, content) ?? 0,
    isKcalEstimated: hasEstimatedKcal(resolved),
    waterMl: isWater(product) ? content.value : 0,
    path: {
      group: product.group.key,
      category: product.category.id,
      foodType: rowKeyOf(product),
      product: product.id,
    },
    content,
    macros: {
      protein: perPackage(resolved.protein.value, content),
      carbs: perPackage(resolved.carbs.value, content),
      fat: perPackage(resolved.fat.value, content),
    },
  }
}

export function toGroupUnit({ unit, product }: JoinedUnit): GroupUnit {
  const { status, bestBefore, checkedAt } = unit
  return {
    status,
    bestBefore,
    checkedAt,
    groupKey: product.group.key,
    amount: product.content.value,
  }
}
