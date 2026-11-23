import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import { StatTiles } from '@/shared/ui/StatTiles'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { OverviewDue } from '../schemas'
import { AllDueLink } from './AllDueLink'
import { DUE_BADGE, dueSubtitle, dueTiles, dueTitle, nothingDueText } from './list-text'

type DueSectionProps = Readonly<{ due: OverviewDue }>

const HEADING_ID = 'bald-faellig'

// Bald fällig direkt auf der Übersicht (DESIGN_SYSTEM §7, Maintainer-Feedback): Zähler je Zeitgruppe
// und die drei dringendsten Einträge, „Alle N“ führt auf die eigene Seite.
export function DueSection({ due }: DueSectionProps) {
  const hasDue = due.total > 0
  return (
    <section aria-labelledby={HEADING_ID}>
      <GroupHeader id={HEADING_ID} trailing={hasDue ? <AllDueLink total={due.total} /> : null}>
        Bald fällig
      </GroupHeader>
      {hasDue ? (
        <div className="flex flex-col gap-2">
          <StatTiles tiles={dueTiles(due.counts)} />
          <Group labelledBy={HEADING_ID}>
            {due.entries.map((entry) => (
              <Row
                key={`${entry.name}-${entry.date}-${entry.group}`}
                title={dueTitle(entry)}
                subtitle={dueSubtitle(entry)}
                trailing={<StatusBadge {...DUE_BADGE[entry.group]} />}
              />
            ))}
          </Group>
        </div>
      ) : (
        <Group labelledBy={HEADING_ID}>
          <Row title={nothingDueText(due)} />
        </Group>
      )}
    </section>
  )
}
