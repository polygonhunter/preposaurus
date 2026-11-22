import type { StockUnit } from '@/features/inventory/domain/unit'
import { err, ok, type Result } from '@/shared/lib/result'
import { estimatedKcalShare } from './approximation'
import type { DailyNeed } from './daily-need'
import { isCountedOn, roundDownDays, type ReferenceDay } from './supply-rules'

/** Eine Einheit mit dem, was sie zur Versorgung beiträgt. */
export interface SupplyUnit extends Pick<StockUnit, 'id' | 'status' | 'bestBefore' | 'checkedAt'> {
  /** kcal dieser Packung (Inhalt × kcal je 100 ÷ 100) */
  kcal: number
  /** kcal stammen aus Richtwert oder KI-Schätzung (`hasEstimatedKcal`), bestätigt oder nicht (E-5) */
  isKcalEstimated: boolean
  /** Inhalt in ml, nur bei Einheiten der Warengruppe Wasser, sonst 0 */
  waterMl: number
}

type Bottleneck = 'energy' | 'water'

export interface SupplyDays {
  energyDays: number
  waterDays: number
  /** Engpass: der kleinere Wert aus Energie- und Wasser-Tagen */
  days: number
  bottleneck: Bottleneck
  /** Mindestens eine gezählte Einheit hat geschätzte kcal oder ein geschätztes MHD */
  containsEstimates: boolean
  /** Anteil der kcal aus Richtwerten bzw. unbestätigten Schätzungen, Grundlage für „ca.“ */
  estimatedKcalShare: number
  kcal: number
  waterMl: number
}

export interface SupplyError {
  kind: 'no-need'
}

export interface SupplyInput {
  units: readonly SupplyUnit[]
  need: Pick<DailyNeed, 'kcalPerDay' | 'waterMlPerDay'>
  reference: ReferenceDay
  /** Haushalts-Einstellung „Noch gut zählt mit“, Standard aus (#117) */
  stillGoodCounts?: boolean
}

const isEstimate = (unit: SupplyUnit) =>
  unit.isKcalEstimated || unit.bestBefore?.isEstimated === true

/** „Versorgt“ am Stichtag (heute oder Zieldatum). Abgelaufene Einheiten zählen nicht. */
export function calculateSupplyDays(input: SupplyInput): Result<SupplyDays, SupplyError> {
  const { units, need, reference } = input
  if (need.kcalPerDay <= 0 || need.waterMlPerDay <= 0) return err({ kind: 'no-need' })
  const counted = units.filter((unit) => isCountedOn(unit, reference, input.stillGoodCounts))
  const kcal = counted.reduce((sum, unit) => sum + unit.kcal, 0)
  const waterMl = counted.reduce((sum, unit) => sum + unit.waterMl, 0)
  const energyDays = kcal / need.kcalPerDay
  const waterDays = waterMl / need.waterMlPerDay
  return ok({
    energyDays: roundDownDays(energyDays),
    waterDays: roundDownDays(waterDays),
    days: roundDownDays(Math.min(energyDays, waterDays)),
    bottleneck: waterDays <= energyDays ? 'water' : 'energy',
    containsEstimates: counted.some(isEstimate),
    estimatedKcalShare: estimatedKcalShare(counted),
    kcal,
    waterMl,
  })
}
