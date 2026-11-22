import type { Quantity } from '@/shared/lib/quantities'
import type { GroupProgress } from './group-progress'

/** Fehlende Menge einer Warengruppe bis zum Ziel, Quelle „ziel“ der Nachkaufen-Liste. */
export interface GoalGap {
  groupKey: string
  missing: Quantity
}

/** Lücke = Ziel minus Bestand. Ist die Lücke geschlossen oder übererfüllt, entfällt die Gruppe. */
export function calculateGoalGap(progress: readonly GroupProgress[]): GoalGap[] {
  return progress
    .filter((group) => group.stock < group.target)
    .map((group) => ({
      groupKey: group.groupKey,
      missing: { value: group.target - group.stock, unit: group.unit },
    }))
}
