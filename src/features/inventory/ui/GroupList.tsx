import { useId } from 'react'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { StockOverview } from '../schemas'
import { groupCoverageText, stockLine } from './stock-format'
import { groupPath } from './stock-paths'

type GroupListProps = Readonly<{ groups: StockOverview['groups'] }>

const EMPTY_GROUP = 'noch nichts'

// Ebene 1 (UX-Konzept §8.3): je Warengruppe Menge und Tage. Leere Gruppen bleiben stehen, denn
// die Lücke ist eine Information.
export function GroupList({ groups }: GroupListProps) {
  const headingId = useId()
  return (
    <>
      <GroupHeader id={headingId}>Warengruppen</GroupHeader>
      <Group labelledBy={headingId}>
        {groups.map((group) => {
          const packages = group.totals.packages + group.totals.uncountedPackages
          return (
            <Row
              key={group.key}
              title={group.name}
              subtitle={packages === 0 ? EMPTY_GROUP : stockLine(packages, group.totals)}
              trailing={groupCoverageText(group)}
              action={{ href: groupPath(group.key) }}
            />
          )
        })}
      </Group>
    </>
  )
}
