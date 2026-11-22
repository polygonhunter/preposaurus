import type { Quantity } from '@/shared/lib/quantities'
import { err, ok, type Result } from '@/shared/lib/result'

/** Umrechnung laut Lebensmittelinformationsverordnung: 1 kcal = 4,184 kJ. */
const KJ_PER_KCAL = 4.184

/** Worauf sich die Werte der Nährwerttabelle beziehen (Schema B der KI). */
type NutritionBasis = '100g' | '100ml' | 'portion'

const PER_100 = 100

const isUsable = (value: number | null): value is number =>
  value !== null && Number.isFinite(value) && value >= 0

export function kjToKcal(kj: number): number {
  return kj / KJ_PER_KCAL
}

/** kcal gewinnt vor kJ. Nur kJ: umrechnen. Fehlt beides oder ist es negativ, ergibt das null. */
export function resolveKcal(label: { kcal: number | null; kj: number | null }): number | null {
  if (isUsable(label.kcal)) return label.kcal
  if (isUsable(label.kj)) return kjToKcal(label.kj)
  return null
}

interface LabelValue {
  value: number
  basis: NutritionBasis
  portionSize: number | null
}

/** Rechnet einen Wert der Tabelle auf 100 g bzw. 100 ml. Bei „Portion“ braucht es deren Größe. */
export function toPer100({
  value,
  basis,
  portionSize,
}: LabelValue): Result<number, { kind: 'portion-size-missing' }> {
  if (basis !== 'portion') return ok(value)
  if (portionSize === null || portionSize <= 0) return err({ kind: 'portion-size-missing' })
  return ok((value * PER_100) / portionSize)
}

/** Menge, auf die sich die Nährwerte beziehen: Das Abtropfgewicht hat Vorrang vor dem Inhalt. */
export function nutritionBase(content: Quantity, drainedWeightG: number | null): number | null {
  if (drainedWeightG !== null && drainedWeightG > 0) return drainedWeightG
  return content.unit === 'piece' ? null : content.value
}

interface UnitNutrition {
  content: Quantity
  drainedWeightG: number | null
  per100: number
}

/** Wert je Packung = Inhalt × Wert je 100 ÷ 100, z. B. 500 g × 359 kcal ÷ 100 = 1.795 kcal. */
export function amountPerUnit({ content, drainedWeightG, per100 }: UnitNutrition): number | null {
  const base = nutritionBase(content, drainedWeightG)
  return base === null ? null : (base * per100) / PER_100
}
