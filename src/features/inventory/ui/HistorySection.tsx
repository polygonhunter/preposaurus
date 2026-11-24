import Link from 'next/link'
import { useId } from 'react'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { HistoryEntry } from '../schemas/detail'
import type { StockTarget } from '../schemas/shared'
import { historyBestBefore, historyLine, historyTitle } from './history-labels'
import { historyHref } from './history-paths'

type HistorySectionProps = Readonly<{ entries: readonly HistoryEntry[]; target: StockTarget }>

// Verlauf dieser Lebensmittelart (UX-Konzept §8.4 Punkt 7, #48): zuletzt verbraucht, entsorgt
// und „Noch gut“ geprüft, neueste zuerst. Nur lesen, Rückgängig gibt es in der UndoBar. „Alle“
// öffnet die Seite Verlauf für diese Lebensmittelart über den ganzen Zeitraum.
export function HistorySection({ entries, target }: HistorySectionProps) {
  const headingId = useId()
  const allLink = (
    <Link href={historyHref({ target, period: 'all' })} className="touch-target text-accent">
      Alle
      <span className="sr-only"> Einträge im Verlauf ansehen</span>
    </Link>
  )
  return (
    <section>
      <GroupHeader id={headingId} trailing={entries.length === 0 ? null : allLink}>
        Verlauf
      </GroupHeader>
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
