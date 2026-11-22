import type { Quantity } from '@/shared/lib/quantities'
import type { GroupProgress } from './group-progress'

/** Fehlende Menge einer Warengruppe bis zum Ziel, Quelle „ziel“ der Nachkaufen-Liste. */
export interface GoalGap {
  groupKey: string
  missing: Quantity
}

// Zielmengen aus Anteilen erzeugen Rauschen wie 839,9999999. Mini-Lücken gehören nicht auf die Liste.
/** Lücken unter diesem Anteil des Ziels entfallen. */
const MIN_GAP_SHARE_OF_TARGET = 0.01
/** Lücken unter dieser Menge in g bzw. ml entfallen. */
const MIN_GAP_AMOUNT = 1

const isRelevantGap = (missing: number, target: number) =>
  missing >= MIN_GAP_AMOUNT && missing >= target * MIN_GAP_SHARE_OF_TARGET

/** Lücke = Ziel minus Bestand. Geschlossene, übererfüllte und winzige Lücken entfallen. */
export function calculateGoalGap(progress: readonly GroupProgress[]): GoalGap[] {
  return progress
    .map((group) => ({ group, missing: group.target - group.stock }))
    .filter(({ group, missing }) => isRelevantGap(missing, group.target))
    .map(({ group, missing }) => ({
      groupKey: group.groupKey,
      missing: { value: missing, unit: group.unit },
    }))
}
