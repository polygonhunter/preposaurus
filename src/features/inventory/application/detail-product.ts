// Bausteine der Detailseite (UX-Konzept §8.4): Nährwerte mit Herkunft und Packungen nach Datum.
import 'server-only'
import { groupByBestBefore, type BestBeforeGroup } from '../domain/group-units'
import { nutritionGapOf } from '../domain/incomplete'
import { isEstimateUnconfirmed } from '../domain/nutrition-source'
import { hasEstimatedKcal } from '../domain/resolve-nutrition'
import { displayStateOf, type StateContext } from '../domain/stock-filter'
import type { StockProduct, StockProductUnit } from '../domain/stock-entry'
import type { BestBeforeGroupDto, NutritionDto } from '../schemas'
import { perPackage, resolvedNutritionOf } from './stock-model'

export function nutritionOf(product: StockProduct): NutritionDto {
  const per100 = resolvedNutritionOf(product)
  const { content, nutrition } = product
  const packageValue = (field: keyof typeof per100) => perPackage(per100[field].value, content)
  return {
    source: nutrition.source,
    isConfirmed: nutrition.source !== null && !isEstimateUnconfirmed(nutrition),
    per100,
    perPackage: {
      kcal: packageValue('kcal'),
      protein: packageValue('protein'),
      carbs: packageValue('carbs'),
      fat: packageValue('fat'),
    },
    isKcalEstimated: hasEstimatedKcal(per100),
    gap: nutritionGapOf(nutrition, product.foodType?.reference ?? null),
  }
}

function isInGroup(unit: StockProductUnit, group: BestBeforeGroup): boolean {
  if (group.kind === 'no-date') return unit.bestBefore === null
  const { bestBefore } = unit
  return (
    bestBefore !== null &&
    bestBefore.date === group.date &&
    bestBefore.precision === group.precision &&
    bestBefore.isEstimated === group.isEstimated
  )
}

const toDetailUnit = ({ id, kind, checkedAt }: StockProductUnit) => ({ id, kind, checkedAt })

/**
 * Packungen nach Datum, frühestes oben, „Datum fehlt“ zuletzt (`groupByBestBefore`). Jede Gruppe
 * nennt ihre Einheiten, damit das Blatt „Einheit“ gezielt entnehmen oder prüfen kann.
 */
export function bestBeforeGroupsOf(
  units: readonly StockProductUnit[],
  context: StateContext,
): BestBeforeGroupDto[] {
  return groupByBestBefore(units.map((unit) => unit.bestBefore)).map((group) => {
    const members = units.filter((unit) => isInGroup(unit, group))
    const detailUnits = members.map(toDetailUnit)
    if (group.kind === 'no-date') return { kind: 'no-date', units: detailUnits }
    const { date, precision, isEstimated } = group
    // Sind alle Packungen „Noch gut“ geprüft, gilt die Gruppe als entschieden
    const isChecked = members.every((unit) => unit.checkedAt !== null)
    const state = displayStateOf({ bestBefore: group, checkedAt: isChecked ? date : null }, context)
    return { kind: 'dated', date, precision, isEstimated, state, units: detailUnits }
  })
}
