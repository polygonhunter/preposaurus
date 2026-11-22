import type { BestBefore } from '@/features/inventory/domain/unit'
import type { CalendarDay } from '@/shared/lib/dates'
import type { Quantity, QuantityUnit } from '@/shared/lib/quantities'
import { ok, type Result } from '@/shared/lib/result'
import { estimatedKcalShare, isApproximate } from './approximation'
import {
  calculateSupplyDays,
  type SupplyError,
  type SupplyInput,
  type SupplyUnit,
} from './supply-days'
import { isCountedOn, isFreshOn } from './supply-rules'

// Summen je Knoten des Baums Warengruppe → Kategorie → Lebensmittelart → Produkt (UX-Konzept A8).
// Der Baum kommt als Daten herein: Jede Einheit trägt ihren Pfad, ein Knoten ist Ebene + Schlüssel.

type TreeLevel = 'group' | 'category' | 'foodType' | 'product'

/** Ort einer Einheit im Baum. Die Schlüssel stammen aus den Stammdaten; null heißt „nicht zugeordnet“. */
export type TreePath = Readonly<Record<TreeLevel, string | null>>

export interface TreeNode {
  level: TreeLevel
  key: string
}

/** Makros in Gramm. */
interface Macros {
  protein: number
  carbs: number
  fat: number
}

/** Eine Packung mit Pfad, Inhalt und Makros je Packung (fehlende Makros zählen als 0). */
export interface NodeUnit extends SupplyUnit {
  path: TreePath
  content: Quantity
  macros: Macros
}

/** Kennwerte eines Knotens, auf jeder Ebene gleich (UX-Konzept §2). */
export interface NodeTotals {
  /** Packungen, die am Stichtag zählen */
  packages: number
  /** Im Vorrat, am Stichtag aber nicht gezählt: abgelaufen, oder am Zieldatum ohne Datum */
  uncountedPackages: number
  amounts: Record<QuantityUnit, number>
  kcal: number
  macros: Macros
  /** Beitrag in Tagen, gerechnet wie „versorgt“ (M2-07) */
  energyDays: number
  waterDays: number
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

function sumContent(units: readonly NodeUnit[]): Record<QuantityUnit, number> {
  const amounts = { g: 0, ml: 0, piece: 0 }
  for (const { content } of units) amounts[content.unit] += content.value
  return amounts
}

function sumMacros(units: readonly NodeUnit[]): Macros {
  const total = { protein: 0, carbs: 0, fat: 0 }
  for (const { macros } of units) {
    total.protein += macros.protein
    total.carbs += macros.carbs
    total.fat += macros.fat
  }
  return total
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

/** Summen eines Knotens am Stichtag. Ein Knoten ohne Packungen ergibt überall 0. */
export function calculateNodeTotals(input: NodeTotalsInput): Result<NodeTotals, SupplyError> {
  const inNode = input.units.filter((unit) => isInNode(unit, input.node))
  const supply = calculateSupplyDays({ ...input, units: inNode })
  if (!supply.ok) return supply
  const counted = inNode.filter((unit) => isCountedOn(unit, input.reference, input.stillGoodCounts))
  const inStock = inNode.filter((unit) => unit.status === 'stock')
  const share = estimatedKcalShare(counted)
  return ok({
    packages: counted.length,
    uncountedPackages: inStock.length - counted.length,
    amounts: sumContent(counted),
    kcal: supply.value.kcal,
    macros: sumMacros(counted),
    energyDays: supply.value.energyDays,
    waterDays: supply.value.waterDays,
    nextBestBefore: earliestBestBefore(counted, input.reference.day),
    withoutDate: inStock.filter((unit) => unit.bestBefore === null).length,
    estimatedKcalShare: share,
    isApproximate: isApproximate(share),
  })
}
