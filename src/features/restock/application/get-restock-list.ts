// Use-Case Nachkaufen-Liste (#72, NK-01 bis NK-04, #200, #201, #202): gespeicherte Einträge plus
// live gerechnete Lücken bis zum Ziel (mit Beispielen) und Vorschläge unter „Ersetzen“ (A14).
// Lücken und Vorschläge werden nie gespeichert und verschwinden von selbst; abgehakte und
// ausgeblendete Lücken verdecken sie, bis sich die Lage ändert.
import 'server-only'
import type { GoalGaps } from '@/features/supply/application/get-goal-gaps'
import type { HouseholdDay } from '@/features/supply/application/stock-snapshot'
import { addDays } from '@/shared/lib/dates'
import {
  RECENT_CONSUMPTION_DAYS,
  replacementCandidates,
  type ReplacementCandidate,
} from '../domain/replacement-candidates'
import type { HiddenGap } from '../domain/goal-entries'
import {
  buildRestockList,
  captureTargetOf,
  type RestockGap,
  type RestockItem,
} from '../domain/restock-list'
import type { HiddenGapDto, RestockItemDto, RestockListDto, RestockSuggestionDto } from '../schemas'
import type { RestockRepository } from './restock-repository'

export interface RestockListPorts {
  repository: Pick<RestockRepository, 'listItems' | 'listReplacementUnits' | 'listGroupFoodTypes'>
  loadGoalGaps: (input: HouseholdDay) => Promise<GoalGaps>
}

const toItemDto = (item: RestockItem): RestockItemDto => ({
  id: item.id,
  label: item.label,
  source: item.source,
  isDone: item.status === 'erledigt',
  captureTarget: captureTargetOf(item),
  amount: item.amount,
})

const toHiddenGapDto = ({
  entryId,
  groupKey,
  name,
  missing,
}: HiddenGap<RestockGap>): HiddenGapDto => ({
  entryId,
  groupKey,
  name,
  missing,
})

const toSuggestionDto = ({
  rowKey,
  productId,
  label,
  reason,
}: ReplacementCandidate): RestockSuggestionDto => ({ rowKey, productId, label, reason })

async function loadParts({ repository, loadGoalGaps }: RestockListPorts, input: HouseholdDay) {
  const { householdId, today } = input
  const [items, goalGaps, units, foodTypes] = await Promise.all([
    repository.listItems(householdId),
    loadGoalGaps(input),
    repository.listReplacementUnits(householdId, addDays(today, -RECENT_CONSUMPTION_DAYS)),
    repository.listGroupFoodTypes(householdId),
  ])
  const candidates = replacementCandidates(units, { today, targetDay: goalGaps.targetDay })
  return { items, goalGaps, candidates, foodTypes }
}

export async function getRestockList(
  ports: RestockListPorts,
  input: HouseholdDay,
): Promise<RestockListDto> {
  const { items, goalGaps, candidates, foodTypes } = await loadParts(ports, input)
  const list = buildRestockList({
    items,
    gaps: goalGaps.gaps,
    foodTypes,
    candidates,
    today: input.today,
  })
  return {
    isGoalCalculable: goalGaps.isCalculable,
    gaps: list.gaps,
    hiddenGaps: list.hiddenGaps.map(toHiddenGapDto),
    belowGoalCount: list.belowGoalCount,
    replace: list.replace.map(toItemDto),
    suggestions: list.suggestions.map(toSuggestionDto),
    own: list.own.map(toItemDto),
    done: list.done.map(toItemDto),
    openItemCount: list.openItemCount,
  }
}
