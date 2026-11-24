import type { BestBefore } from '@/features/inventory/domain/unit'
import type { CalendarDay } from '@/shared/lib/dates'
import type { ContentQuantity, ContentUnit } from '@/shared/lib/quantities'
import { isInStockWithoutDate } from '@/shared/lib/stock-unit'
import { isApproximate } from '@/shared/lib/approximation'
import { estimatedKcalShare } from './approximation'
import { sumMacros, type Macros, type PackageMacros } from './node-macros'
import type { SupplyInput, SupplyUnit } from './supply-days'
import { daysOrNull, isCountedOn, isFreshOn } from './supply-rules'

// Summen je Knoten des Baums Warengruppe → Kategorie → Lebensmittelart → Produkt (UX-Konzept A8).
// Der Baum kommt als Daten herein: Jede Einheit trägt ihren Pfad, ein Knoten ist Ebene + Schlüssel.

type TreeLevel = 'group' | 'category' | 'foodType' | 'product'

/** Ort einer Einheit im Baum. Die Schlüssel stammen aus den Stammdaten; null heißt „nicht zugeordnet“. */
type TreePath = Readonly<Record<TreeLevel, string | null>>

export interface TreeNode {
  level: TreeLevel
  key: string
}

/** Eine Packung mit Pfad, Inhalt und Makros je Packung (aufgelöst, fehlende sind null). */
export interface NodeUnit extends SupplyUnit {
  path: TreePath
  content: ContentQuantity
  macros: PackageMacros
}

/** Kennwerte eines Knotens, auf jeder Ebene gleich (UX-Konzept §2). */
export interface NodeTotals {
  /** Packungen, die am Stichtag zählen */
  packages: number
  /** Im Vorrat, am Stichtag aber nicht gezählt: abgelaufen, oder am Zieldatum ohne Datum */
  uncountedPackages: number
  amounts: Record<ContentUnit, number>
  kcal: number
  /** Wasser in ml, das in die Wasser-Tage zählt (andere Getränke nicht), für das Erklär-Blatt (#230) */
  waterMl: number
  /** Summe der bekannten Makros der gezählten Packungen */
  macros: Macros
  /** Gezählte Produkte mit fehlendem Makro: Hinweis „ohne N Produkte“ statt stiller Null */
  productsWithoutMacros: number
  /** Beitrag in Tagen, gerechnet wie „versorgt“ (M2-07). Ohne Bedarf null, der Rest zählt weiter */
  energyDays: number | null
  waterDays: number | null
  /** Frühestes MHD der gezählten Packungen, null wenn keine ein Datum hat */
  nextBestBefore: BestBefore | null
  /** Packungen im Vorrat mit „Datum fehlt“, gesondert gezählt */
  withoutDate: number
  estimatedKcalShare: number
  /** „ca.“ anzeigen: Richtwert-Anteil an den kcal ab der Schwelle */
  isApproximate: boolean
}

interface NodeTotalsInput extends Omit<SupplyInput, 'units'> {
  units: readonly NodeUnit[]
  node: TreeNode
}

const isInNode = (unit: NodeUnit, node: TreeNode) => unit.path[node.level] === node.key

function sumContent(units: readonly NodeUnit[]): Record<ContentUnit, number> {
  const amounts = { g: 0, ml: 0 }
  for (const { content } of units) amounts[content.unit] += content.value
  return amounts
}

/**
 * Frühestes Datum, das am Stichtag noch hält. Abgelaufene „Noch gut“-Packungen zählen zwar mit
 * dem Schalter heute mit, ein vergangenes Datum ist aber kein „nächstes MHD“. Bei gleichem Datum
 * gewinnt die zuerst genannte Packung.
 */
function earliestBestBefore(units: readonly NodeUnit[], day: CalendarDay): BestBefore | null {
  let earliest: BestBefore | null = null
  for (const unit of units) {
    const { bestBefore } = unit
    if (bestBefore === null || !isFreshOn(unit, day)) continue
    if (earliest === null || bestBefore.date < earliest.date) earliest = bestBefore
  }
  return earliest
}

const sumOf = (units: readonly NodeUnit[], pick: (unit: NodeUnit) => number) =>
  units.reduce((total, unit) => total + pick(unit), 0)

/** Summen eines Knotens am Stichtag. Ein Knoten ohne Packungen ergibt überall 0. */
export function calculateNodeTotals(input: NodeTotalsInput): NodeTotals {
  const inNode = input.units.filter((unit) => isInNode(unit, input.node))
  const counted = inNode.filter((unit) => isCountedOn(unit, input.reference, input.stillGoodCounts))
  const inStock = inNode.filter((unit) => unit.status === 'stock')
  const share = estimatedKcalShare(counted)
  const kcal = sumOf(counted, (unit) => unit.kcal)
  const waterMl = sumOf(counted, (unit) => unit.waterMl)
  const { productsWithoutMacros, ...macros } = sumMacros(counted)
  return {
    packages: counted.length,
    uncountedPackages: inStock.length - counted.length,
    amounts: sumContent(counted),
    kcal,
    waterMl,
    macros,
    productsWithoutMacros,
    energyDays: daysOrNull(kcal, input.need.kcalPerDay),
    waterDays: daysOrNull(waterMl, input.need.waterMlPerDay),
    nextBestBefore: earliestBestBefore(counted, input.reference.day),
    withoutDate: inNode.filter(isInStockWithoutDate).length,
    estimatedKcalShare: share,
    isApproximate: isApproximate(share),
  }
}
