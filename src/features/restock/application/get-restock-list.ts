// Use-Case Nachkaufen-Liste (#72, NK-01, NK-03, NK-04): gespeicherte Einträge plus die live
// gerechneten Lücken bis zum Ziel. Lücken werden nie gespeichert und verschwinden, wenn sie zu sind.
import 'server-only'
import type { GoalGaps } from '@/features/supply/application/get-goal-gaps'
import type { HouseholdDay } from '@/features/supply/application/stock-snapshot'
import { buildRestockList, captureTargetOf, type RestockItem } from '../domain/restock-list'
import type { RestockItemDto, RestockListDto } from '../schemas'
import type { RestockRepository } from './restock-repository'

export interface RestockListPorts {
  repository: Pick<RestockRepository, 'listItems'>
  loadGoalGaps: (input: HouseholdDay) => Promise<GoalGaps>
}

const toItemDto = (item: RestockItem): RestockItemDto => ({
  id: item.id,
  label: item.label,
  source: item.source,
  isDone: item.isDone,
  captureTarget: captureTargetOf(item),
})

export async function getRestockList(
  ports: RestockListPorts,
  input: HouseholdDay,
): Promise<RestockListDto> {
  const [items, goalGaps] = await Promise.all([
    ports.repository.listItems(input.householdId),
    ports.loadGoalGaps(input),
  ])
  const list = buildRestockList({ items, gaps: goalGaps.gaps })
  return {
    isGoalCalculable: goalGaps.isCalculable,
    gaps: list.gaps,
    replace: list.replace.map(toItemDto),
    own: list.own.map(toItemDto),
    done: list.done.map(toItemDto),
    openCount: list.openCount,
  }
}
