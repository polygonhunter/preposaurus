import { useId } from 'react'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { HistoryEntry } from '../schemas'
import { historyBestBefore, historyLine, historyTitle } from './history-labels'

type HistorySectionProps = Readonly<{ entries: readonly HistoryEntry[] }>

// Verlauf dieser Lebensmittelart (UX-Konzept §8.4 Punkt 7, #48): zuletzt verbraucht, entsorgt
// und „Noch gut“ geprüft, neueste zuerst. Nur lesen, Rückgängig gibt es in der UndoBar.
export function HistorySection({ entries }: HistorySectionProps) {
  const headingId = useId()
  return (
    <section>
      <GroupHeader id={headingId}>Verlauf</GroupHeader>
      <Group labelledBy={headingId}>
        {entries.length === 0 ? (
          <Row title="Noch nichts verbraucht oder entsorgt" />
        ) : (
          entries.map((entry, index) => (
            <Row
              // Einträge haben keine eigene ID, die Reihenfolge ist fest (neueste zuerst)
              key={`${entry.kind}-${entry.day}-${String(index)}`}
              title={historyTitle(entry)}
              subtitle={historyLine(entry)}
              trailing={historyBestBefore(entry)}
            />
          ))
        )}
      </Group>
    </section>
  )
}
