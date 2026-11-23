// Lücke bis zum Ziel abhaken oder ausblenden (#201, UX-Konzept §8.6). Die Fehlmenge rechnet der
// Server in diesem Moment selbst, statt sie vom Gerät zu übernehmen: Gespeichert wird, was die
// Liste gerade zeigt, und eine schon geschlossene Lücke lässt sich nicht mehr abhaken.
import 'server-only'
import type { GoalGaps } from '@/features/supply/application/get-goal-gaps'
import type { HouseholdDay } from '@/features/supply/application/stock-snapshot'
import { err, ok, type Result } from '@/shared/lib/result'
import type { GapStatusChange } from '../schemas'
import type { RestockRepository } from './restock-repository'

export interface GapStatusPorts {
  repository: Pick<RestockRepository, 'saveGapEntry'>
  loadGoalGaps: (input: HouseholdDay) => Promise<GoalGaps>
}

export interface SavedGapEntry {
  /** Der Eintrag, den „Rückgängig“ bzw. „Wieder zeigen“ entfernt */
  entryId: string
  label: string
}

export async function setGapStatus(
  { repository, loadGoalGaps }: GapStatusPorts,
  { groupKey, status, ...day }: HouseholdDay & GapStatusChange,
): Promise<Result<SavedGapEntry, Readonly<{ kind: 'not-found' }>>> {
  const { gaps } = await loadGoalGaps(day)
  const gap = gaps.find((entry) => entry.groupKey === groupKey)
  if (gap === undefined) return err({ kind: 'not-found' })
  const entryId = await repository.saveGapEntry(day.householdId, {
    groupKey,
    label: gap.name,
    missing: gap.missing,
    status,
  })
  return entryId === null ? err({ kind: 'not-found' }) : ok({ entryId, label: gap.name })
}
