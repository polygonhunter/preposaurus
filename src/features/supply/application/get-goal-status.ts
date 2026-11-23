// Stand des Ziels für die Wochenübersicht der Erinnerungen (#186): dieselbe Rechnung wie die
// Zielzeile der Übersicht (headFigures), nur ohne die übrigen Blöcke.
import 'server-only'
import { toNodeUnit } from '@/features/inventory/application/stock-model'
import type { CalendarDay } from '@/shared/lib/dates'
import type { GoalGapPorts } from './get-goal-gaps'
import { headFigures } from './overview-figures'
import { dailyNeedOf } from './stock-figures'
import { loadStockSnapshot, type HouseholdDay } from './stock-snapshot'

export interface GoalStatus {
  /** Tage am Zieldatum, ohne gültiges Zieldatum heute */
  suppliedDays: number
  targetDays: number
  /** null ohne Zieldatum oder wenn es schon vorbei ist */
  targetDate: CalendarDay | null
}

/** null ohne Ziel oder ohne Bedarf (keine Mitglieder, keine Empfehlung). */
export async function getGoalStatus(
  ports: GoalGapPorts,
  input: HouseholdDay,
): Promise<GoalStatus | null> {
  const [{ context, units }, goal] = await Promise.all([
    loadStockSnapshot(ports.stock, input),
    ports.facts.loadGoal(input.householdId),
  ])
  if (goal === null) return null
  const head = headFigures({
    units: units.map(toNodeUnit),
    need: dailyNeedOf(context.basis),
    today: input.today,
    goal,
    stillGoodCounts: context.stillGoodCounts,
  })
  if (head.supply === null) return null
  const outlook = head.goal?.outlook ?? null
  return outlook?.kind === 'valid'
    ? { suppliedDays: outlook.days, targetDays: goal.days, targetDate: goal.targetDay }
    : { suppliedDays: head.supply.days, targetDays: goal.days, targetDate: null }
}
