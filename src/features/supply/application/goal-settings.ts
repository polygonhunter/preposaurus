// Ziel und Empfehlung in den Einstellungen (#39, ZIEL-01, ZIEL-03, ZIEL-04). Lesen dürfen alle im
// Haushalt, ändern nur der Admin (die Action prüft das). Der Rechenmodus ist im MVP fest
// „Offiziell“. Ohne Ziel gilt der Standard der Quelle, ohne Quelle DEFAULT_GOAL_DAYS.
import 'server-only'
import { DEFAULT_GOAL_DAYS } from '@/shared/config/constants'
import type { CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import type { RecommendationSource } from '../data/goal-repository'
import { isTargetDateInPast } from '../domain/goal-settings'
import type { GoalInput } from '../schemas'
import type { GoalServices } from './goal-services'

export type GoalSettings = Readonly<{
  days: number
  targetDate: CalendarDay | null
  /** Das gespeicherte Datum ist inzwischen vorbei: Die Seite bittet um ein neues. */
  isTargetDatePast: boolean
  source: RecommendationSource | null
  /** Standard der Zieldauer: aus der Quelle, sonst DEFAULT_GOAL_DAYS */
  defaultDays: number
}>

export async function getGoalSettings(
  deps: GoalServices,
  householdId: string,
): Promise<GoalSettings> {
  const stored = await deps.goals.read(householdId)
  const defaultDays = stored.source?.defaultDays ?? DEFAULT_GOAL_DAYS
  const { targetDate } = stored
  return {
    days: stored.days ?? defaultDays,
    targetDate,
    isTargetDatePast: targetDate !== null && isTargetDateInPast(targetDate, deps.today),
    source: stored.source,
    defaultDays,
  }
}

export interface SaveGoalError {
  kind: 'target-in-past'
}

export async function saveGoal(
  deps: GoalServices,
  command: Readonly<{ householdId: string; input: GoalInput }>,
): Promise<Result<null, SaveGoalError>> {
  const { days, targetDate } = command.input
  if (targetDate !== null && isTargetDateInPast(targetDate, deps.today)) {
    return err({ kind: 'target-in-past' })
  }
  await deps.goals.save(command.householdId, { days, targetDate })
  return ok(null)
}
