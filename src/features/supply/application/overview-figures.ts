// Kopf der Übersicht (#67, #68): „Heute versorgt“, Stand am Zieldatum und der nächste Schritt.
// Gerechnet wird in supply/domain (calculateSupplyDays, calculateGoalProgress, calculateNextStep),
// hier wird nur gewählt und ins DTO übertragen.
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import type { DailyNeed } from '../domain/daily-need'
import { calculateGoalProgress, type GoalProgress } from '../domain/goal-progress'
import { calculateNextStep } from '../domain/next-step'
import { calculateSupplyDays, type SupplyDays, type SupplyUnit } from '../domain/supply-days'
import type { OverviewGoal, OverviewNextStep, OverviewSupply } from '../schemas'
import type { HouseholdGoal } from './household-facts-reader'

interface FiguresInput {
  units: readonly SupplyUnit[]
  need: Pick<DailyNeed, 'kcalPerDay' | 'waterMlPerDay'>
  today: CalendarDay
  goal: HouseholdGoal | null
  stillGoodCounts: boolean
}

export interface HeadFigures {
  supply: OverviewSupply | null
  goal: OverviewGoal | null
  nextStep: OverviewNextStep | null
}

type Outlook = GoalProgress<SupplyUnit>['target']

function toSupplyDto(days: SupplyDays): OverviewSupply {
  const { energyDays, waterDays, bottleneck, isApproximate } = days
  return { days: days.days, energyDays, waterDays, bottleneck, isApproximate }
}

function toOutlookDto(target: Outlook): OverviewGoal['outlook'] {
  if (target.kind === 'target-in-past') return { kind: 'in-past' }
  return {
    kind: 'valid',
    days: target.atTarget.days,
    isReached: target.isGoalReached,
    expiringPackages: target.expiringBeforeTarget.length,
  }
}

/** Mit Zieldatum zusätzlich der Stand an diesem Tag, sonst nur heute. Ohne Bedarf null. */
function supplyAndOutlook(
  input: FiguresInput,
): { today: SupplyDays; outlook: Outlook | null } | null {
  const { units, need, today, goal, stillGoodCounts } = input
  const targetDay = goal?.targetDay ?? null
  if (goal !== null && targetDay !== null) {
    const progress = calculateGoalProgress({
      units,
      need,
      stillGoodCounts,
      today,
      goal: { days: goal.days, targetDay },
    })
    return progress.ok ? { today: progress.value.today, outlook: progress.value.target } : null
  }
  const reference = { day: today, kind: 'today' } as const
  const now = calculateSupplyDays({ units, need, reference, stillGoodCounts })
  return now.ok ? { today: now.value, outlook: null } : null
}

function toGoalDto(goal: HouseholdGoal | null, outlook: Outlook | null): OverviewGoal | null {
  if (goal === null) return null
  return {
    days: goal.days,
    date: goal.targetDay,
    outlook: outlook === null ? null : toOutlookDto(outlook),
  }
}

export function headFigures(input: FiguresInput): HeadFigures {
  const { goal, need } = input
  const figures = supplyAndOutlook(input)
  const goalDto = toGoalDto(goal, figures?.outlook ?? null)
  if (figures === null) return { supply: null, goal: goalDto, nextStep: null }
  const nextStep =
    goal === null ? null : calculateNextStep({ today: figures.today, goalDays: goal.days, need })
  return { supply: toSupplyDto(figures.today), goal: goalDto, nextStep }
}
