// Richtwerte einer Lebensmittelart zwischen Fachlogik und Tabelle (#243). numeric kommt als Text aus
// dem Treiber und geht als Text hinein, leer bleibt null. Die Haltbarkeit ist integer.
import 'server-only'
import type { FoodTypeReference } from '@/features/catalog/domain/category'
import { foodTypes } from '@/server/db/schema/food-types'

const toNumeric = (value: number | null) => (value === null ? null : String(value))
const fromNumeric = (value: string | null) => (value === null ? null : Number(value))

/** Spalten für select: Richtwerte, wie sie in der Tabelle stehen */
export const referenceColumns = {
  kcalPer100: foodTypes.kcalPer100,
  proteinPer100: foodTypes.proteinPer100,
  carbsPer100: foodTypes.carbsPer100,
  fatPer100: foodTypes.fatPer100,
  typicalShelfLifeMonths: foodTypes.typicalShelfLifeMonths,
}

type ReferenceRow = Readonly<{
  kcalPer100: string | null
  proteinPer100: string | null
  carbsPer100: string | null
  fatPer100: string | null
  typicalShelfLifeMonths: number | null
}>

export function fromReferenceRow(row: ReferenceRow): FoodTypeReference {
  return {
    kcalPer100: fromNumeric(row.kcalPer100),
    proteinPer100: fromNumeric(row.proteinPer100),
    carbsPer100: fromNumeric(row.carbsPer100),
    fatPer100: fromNumeric(row.fatPer100),
    typicalShelfLifeMonths: row.typicalShelfLifeMonths,
  }
}

export function toReferenceRow(reference: FoodTypeReference): ReferenceRow {
  return {
    kcalPer100: toNumeric(reference.kcalPer100),
    proteinPer100: toNumeric(reference.proteinPer100),
    carbsPer100: toNumeric(reference.carbsPer100),
    fatPer100: toNumeric(reference.fatPer100),
    typicalShelfLifeMonths: reference.typicalShelfLifeMonths,
  }
}
