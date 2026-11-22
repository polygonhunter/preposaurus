import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import type { OverviewGoal, OverviewNextStep, OverviewSupply } from '../schemas'
import { goalLine, nextStepSentence } from './head-text'
import { OVERVIEW_PATHS } from './overview-paths'

type GoalGroupProps = Readonly<{
  goal: OverviewGoal
  supply: OverviewSupply
  nextStep: OverviewNextStep | null
}>

// Zielzeile und der eine nächste Schritt (UX-Konzept §8.1 Zeilen 3 und 4). Ohne gültiges Zieldatum
// führt die Zielzeile in die Einstellungen, sonst nach Bald fällig.
export function GoalGroup({ goal, supply, nextStep }: GoalGroupProps) {
  const line = goalLine(goal)
  const goalHref = goal.outlook?.kind === 'valid' ? OVERVIEW_PATHS.due : OVERVIEW_PATHS.settings
  return (
    <div className="pt-5">
      <Group>
        <Row
          title={line.title}
          {...(line.subtitle === null ? {} : { subtitle: line.subtitle })}
          action={{ href: goalHref }}
        />
        {nextStep === null ? null : (
          <Row
            title={nextStepSentence(nextStep, supply, goal.days)}
            subtitle="Nächster Schritt"
            action={{ href: OVERVIEW_PATHS.restock }}
          />
        )}
      </Group>
    </div>
  )
}
