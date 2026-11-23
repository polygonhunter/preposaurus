import type { StockUnit } from '@/features/inventory/domain/unit'
import { err, ok, type Result } from '@/shared/lib/result'
import { isApproximate } from '@/shared/lib/approximation'
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
  /** Anteil der kcal aus Richtwerten bzw. KI-Schätzungen (0 bis 1) */
  estimatedKcalShare: number
  /** „ca.“ an der Kernzahl. Ein geschätztes MHD zählt nicht, „ca.“ betrifft nur kcal */
  isApproximate: boolean
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
  /** Haushalts-Einstellung „Noch gut zählt mit“ (#117) */
  stillGoodCounts: boolean
}

/** „Versorgt“ am Stichtag (heute oder Zieldatum). Abgelaufene Einheiten zählen nicht. */
export function calculateSupplyDays(input: SupplyInput): Result<SupplyDays, SupplyError> {
  const { units, need, reference } = input
  if (need.kcalPerDay <= 0 || need.waterMlPerDay <= 0) return err({ kind: 'no-need' })
  const counted = units.filter((unit) => isCountedOn(unit, reference, input.stillGoodCounts))
  const kcal = counted.reduce((sum, unit) => sum + unit.kcal, 0)
  const waterMl = counted.reduce((sum, unit) => sum + unit.waterMl, 0)
  const share = estimatedKcalShare(counted)
  const energyDays = kcal / need.kcalPerDay
  const waterDays = waterMl / need.waterMlPerDay
  return ok({
    energyDays: roundDownDays(energyDays),
    waterDays: roundDownDays(waterDays),
    days: roundDownDays(Math.min(energyDays, waterDays)),
    bottleneck: waterDays <= energyDays ? 'water' : 'energy',
    estimatedKcalShare: share,
    isApproximate: isApproximate(share),
    kcal,
    waterMl,
  })
}
