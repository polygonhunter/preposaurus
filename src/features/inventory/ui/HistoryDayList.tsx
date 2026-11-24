import { detailPath } from '@/shared/config/stock-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { HistoryPage } from '../schemas/history'
import { historyBestBefore, historyDayLabel, outcomeLine } from './history-labels'

type HistoryDayListProps = Readonly<{ days: HistoryPage['days'] }>

// Verlauf als Liste (#48) bis „weit“: je Tag eine Gruppe, je Packung eine Zeile mit Ausgang, Person
// und MHD. Die Zeile führt ins Detail der Lebensmittelart, auch wenn dort nichts mehr liegt.
export function HistoryDayList({ days }: HistoryDayListProps) {
  return days.map(({ day, items }) => {
    const headingId = `verlauf-${day}`
    return (
      <section key={day}>
        <GroupHeader id={headingId}>{historyDayLabel(day)}</GroupHeader>
        <Group labelledBy={headingId}>
          {items.map((item) => (
            <Row
              key={item.unitId}
              title={item.name}
              subtitle={outcomeLine(item)}
              trailing={historyBestBefore(item)}
              action={{ href: detailPath(item.target) }}
            />
          ))}
        </Group>
      </section>
    )
  })
}
