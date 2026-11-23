import type { DailyNeed } from './daily-need'
import type { SupplyDays } from './supply-days'

// Nächster Schritt der Übersicht (UX-Konzept A4, §8.1 Zeile 4): Was bringt euch am schnellsten
// weiter? Die Fehlmenge des Engpasses bis zum Ziel, als ml Wasser bzw. kcal. Liegt auch der andere
// Wert unter dem Ziel, kommt seine Fehlmenge dazu: Sonst brächte z. B. viel Wasser nur wenige Tage,
// weil danach das Essen begrenzt.
// Gerechnet wird mit dem ungerundeten Bestand (Bedarf bis zum Ziel minus Bestand), nicht mit den
// abgerundeten Tagen: Sonst verlangte die App mehr, als zum Ziel fehlt (#214). Gerundet wird erst
// in der Anzeige.

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
  /** Bestand am Stichtag: kcal und ml Wasser, dazu der Engpass */
  today: Pick<SupplyDays, 'kcal' | 'waterMl' | 'bottleneck'>
  goalDays: number
  need: Pick<DailyNeed, 'kcalPerDay' | 'waterMlPerDay'>
}

const perDayOf = (resource: Resource, need: NextStepInput['need']) =>
  resource === 'water' ? need.waterMlPerDay : need.kcalPerDay

const stockOf = (resource: Resource, today: NextStepInput['today']) =>
  resource === 'water' ? today.waterMl : today.kcal

const otherOf = (resource: Resource): Resource => (resource === 'water' ? 'energy' : 'water')

/** Zieltage × Tagesbedarf − Bestand, null ohne Lücke oder ohne Bedarf. */
function shortfallOf(resource: Resource, input: NextStepInput): Shortfall | null {
  const perDay = perDayOf(resource, input.need)
  if (perDay <= 0) return null
  const missing = input.goalDays * perDay - stockOf(resource, input.today)
  return missing > 0 ? { resource, missing } : null
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
