// Lücke bis zum Ziel je Warengruppe (A13, NK-01) für die Nachkaufen-Liste (#72). Gleicher Stichtag
// und gleiche Rechnung wie der Hinweis auf der Übersicht, damit beide dieselbe Zahl nennen.
import 'server-only'
import type { StockReader } from '@/features/inventory/application/stock-reader'
import { WATER_GROUP_KEY } from '@/features/inventory/application/stock-model'
import type { ContentQuantity } from '@/shared/lib/quantities'
import { calculateGoalGap } from '../domain/goal-gap'
import type { GroupProgress } from '../domain/group-progress'
import type { HouseholdFactsReader } from './household-facts-reader'
import { loadStockSnapshot, progressAtTarget, type HouseholdDay } from './stock-snapshot'

export interface GoalGapPorts {
  stock: StockReader
  facts: Pick<HouseholdFactsReader, 'loadGoal'>
}

interface GroupGap {
  groupKey: string
  name: string
  missing: ContentQuantity
  /** Tage am Stichtag des Ziels, „6 von 10 Tagen“ */
  days: number
  goalDays: number
}

export interface GoalGaps {
  /** false ohne Ziel oder ohne Empfehlung: dann gibt es nichts zu rechnen */
  isCalculable: boolean
  /** Wasser zuerst (UX-Konzept §8.6), sonst in der Reihenfolge der Warengruppen */
  gaps: GroupGap[]
}

const waterFirst = (a: GroupGap, b: GroupGap) =>
  Number(b.groupKey === WATER_GROUP_KEY) - Number(a.groupKey === WATER_GROUP_KEY)

function toGroupGaps(progress: readonly GroupProgress[], names: ReadonlyMap<string, string>) {
  const byKey = new Map(progress.map((entry) => [entry.groupKey, entry]))
  return calculateGoalGap(progress).flatMap(({ groupKey, missing }) => {
    const entry = byKey.get(groupKey)
    if (entry === undefined) return []
    const name = names.get(groupKey) ?? groupKey
    return [{ groupKey, name, missing, days: entry.days, goalDays: entry.goalDays }]
  })
}

export async function getGoalGaps(ports: GoalGapPorts, input: HouseholdDay): Promise<GoalGaps> {
  const [{ context, groups, units }, goal] = await Promise.all([
    loadStockSnapshot(ports.stock, input),
    ports.facts.loadGoal(input.householdId),
  ])
  const progress = progressAtTarget(context, units, goal)
  const names = new Map(groups.map((group) => [group.key, group.shortName]))
  return {
    isCalculable: progress.length > 0,
    gaps: toGroupGaps(progress, names).sort(waterFirst),
  }
}
