import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import type { CalendarDay } from '@/shared/lib/dates'
import { formatGoalDays, formatTargetDate } from './goal-format'

type GoalView = Readonly<{ days: number; targetDate: CalendarDay | null }>

type GoalSummaryProps = Readonly<{ goal: GoalView; labelledBy: string }>

// Ziel nur zum Lesen für Mitglieder (EINSTELLUNGEN_NUTZER §5: „liest“).
export function GoalSummary({ goal, labelledBy }: GoalSummaryProps) {
  return (
    <Group labelledBy={labelledBy}>
      <Row title="Zieldauer" trailing={formatGoalDays(goal.days)} />
      <Row
        title="Zieldatum"
        trailing={goal.targetDate === null ? 'keins' : formatTargetDate(goal.targetDate)}
      />
    </Group>
  )
}
