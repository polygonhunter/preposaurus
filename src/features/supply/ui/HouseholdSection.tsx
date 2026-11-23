import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { OverviewGoal, OverviewHousehold } from '../schemas'
import { householdTitle, sourceText } from './list-text'
import { OVERVIEW_PATHS } from './overview-paths'

type HouseholdSectionProps = Readonly<{ household: OverviewHousehold; goal: OverviewGoal | null }>

const HEADING_ID = 'haushalt'

// Haushalt knapp (UX-Konzept §8.1 Punkt 6): Personen, Ziel und Quelle mit Stand, führt in die
// Einstellungen.
export function HouseholdSection({ household, goal }: HouseholdSectionProps) {
  return (
    <section aria-labelledby={HEADING_ID}>
      <GroupHeader id={HEADING_ID}>Haushalt</GroupHeader>
      <Group labelledBy={HEADING_ID}>
        <Row
          title={householdTitle(household, goal)}
          subtitle={sourceText(household)}
          action={{ href: OVERVIEW_PATHS.settings }}
        />
      </Group>
    </section>
  )
}
