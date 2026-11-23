import type { DailyNeed } from './daily-need'
import type { SupplyDays } from './supply-days'

// Nächster Schritt der Übersicht (UX-Konzept A4, §8.1 Zeile 4): Was bringt euch am schnellsten
// weiter? Die Fehlmenge des Engpasses bis zum Ziel, als ml Wasser bzw. kcal. Liegt auch der andere
// Wert unter dem Ziel, kommt seine Fehlmenge dazu: Sonst brächte z. B. viel Wasser nur wenige Tage,
// weil danach das Essen begrenzt.

type Resource = SupplyDays['bottleneck']

interface Shortfall {
  resource: Resource
  /** Fehlmenge bis zum Ziel: ml bei Wasser, kcal bei Essen */
  missing: number
}

export interface NextStep extends Shortfall {
  /** Fehlmenge des anderen Werts bis zum Ziel, null wenn er das Ziel heute schon erreicht */
  alsoMissing: Shortfall | null
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

/** (Zieltage − Ist-Tage) × Tagesbedarf, null ohne Lücke oder ohne Bedarf. */
function shortfallOf(resource: Resource, input: NextStepInput): Shortfall | null {
  const shortfallDays = input.goalDays - daysOf(resource, input.today)
  const perDay = perDayOf(resource, input.need)
  if (shortfallDays <= 0 || perDay <= 0) return null
  return { resource, missing: shortfallDays * perDay }
}

/**
 * Fehlmenge des Engpasses bis zum Ziel, dazu die des anderen Werts, wenn auch er darunter liegt.
 * Ohne Lücke (Ziel heute erreicht) oder ohne Bedarf gibt es keinen Schritt: null.
 */
export function calculateNextStep(input: NextStepInput): NextStep | null {
  const main = shortfallOf(input.today.bottleneck, input)
  if (main === null) return null
  return { ...main, alsoMissing: shortfallOf(otherOf(input.today.bottleneck), input) }
}
