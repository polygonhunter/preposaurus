import type { DailyNeed } from './daily-need'
import type { SupplyDays } from './supply-days'
import { roundDownDays } from './supply-rules'

// Nächster Schritt der Übersicht (UX-Konzept A4, §8.1 Zeile 4): Was bringt euch am schnellsten
// weiter? Die Fehlmenge des Engpasses bis zum Ziel, als ml Wasser bzw. kcal.

type Resource = SupplyDays['bottleneck']

export interface NextStep {
  /** Engpass, den der Schritt schließt */
  resource: Resource
  /** Fehlmenge bis zum Ziel: ml bei Wasser, kcal bei Essen */
  missing: number
  /** Tage danach: Ziel oder der andere Wert, wenn der vorher begrenzt (abgerundet) */
  reachesDays: number
}

interface NextStepInput {
  today: Pick<SupplyDays, 'energyDays' | 'waterDays' | 'bottleneck'>
  goalDays: number
  need: Pick<DailyNeed, 'kcalPerDay' | 'waterMlPerDay'>
}

const perDayOf = (resource: Resource, need: NextStepInput['need']) =>
  resource === 'water' ? need.waterMlPerDay : need.kcalPerDay

const daysOf = (resource: Resource, today: NextStepInput['today']) =>
  resource === 'water' ? today.waterDays : today.energyDays

const otherOf = (resource: Resource): Resource => (resource === 'water' ? 'energy' : 'water')

/**
 * Fehlmenge des Engpasses bis zum Ziel: (Zieltage − Ist-Tage) × Tagesbedarf. Ohne Lücke (Ziel heute
 * erreicht) oder ohne Bedarf gibt es keinen Schritt: null.
 */
export function calculateNextStep({ today, goalDays, need }: NextStepInput): NextStep | null {
  const { bottleneck } = today
  const shortfallDays = goalDays - daysOf(bottleneck, today)
  const perDay = perDayOf(bottleneck, need)
  if (shortfallDays <= 0 || perDay <= 0) return null
  return {
    resource: bottleneck,
    missing: shortfallDays * perDay,
    reachesDays: roundDownDays(Math.min(goalDays, daysOf(otherOf(bottleneck), today))),
  }
}
