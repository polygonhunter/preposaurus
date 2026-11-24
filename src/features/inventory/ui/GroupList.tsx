import { useId } from 'react'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { NamedDays } from '@/shared/ui/NamedDays'
import { Row } from '@/shared/ui/Row'
import type { StockOverview } from '../schemas/stock'
import { groupDays, hasStock, stockLine } from './stock-format'
import { groupPath } from './stock-paths'

type GroupListProps = Readonly<{ groups: StockOverview['groups'] }>

const EMPTY_GROUP = 'noch nichts'

// Ebene 1 (UX-Konzept §8.3): je Warengruppe Menge und eine Tage-Zahl mit Namen (#209). Leere
// Gruppen bleiben stehen, denn die Lücke ist eine Information.
export function GroupList({ groups }: GroupListProps) {
  const headingId = useId()
  return (
    <>
      <GroupHeader id={headingId}>Warengruppen</GroupHeader>
      <Group labelledBy={headingId}>
        {groups.map((group) => {
          const days = groupDays(group)
          return (
            <Row
              key={group.key}
              title={group.shortName}
              subtitle={hasStock(group.totals) ? stockLine(group.totals) : EMPTY_GROUP}
              trailing={days === null ? null : <NamedDays days={days} />}
              action={{ href: groupPath(group.key) }}
            />
          )
        })}
      </Group>
    </>
  )
}
