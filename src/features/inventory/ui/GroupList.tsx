import { useId } from 'react'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { StockOverview } from '../schemas/stock'
import { groupCoverageText, hasStock, stockLine } from './stock-format'
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
        {groups.map((group) => (
          <Row
            key={group.key}
            title={group.shortName}
            subtitle={hasStock(group.totals) ? stockLine(group.totals) : EMPTY_GROUP}
            trailing={groupCoverageText(group)}
            action={{ href: groupPath(group.key) }}
          />
        ))}
      </Group>
    </>
  )
}
