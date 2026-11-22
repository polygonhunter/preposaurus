import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { DueUnits } from '../schemas'
import { ConsumeButton } from './ConsumeButton'
import {
  DUE_GROUP_TONE,
  dueCounterLabel,
  dueEntryLine,
  dueEntryTitle,
  dueGroupAnchor,
  dueGroupTitle,
} from './due-labels'
import { BEST_BEFORE_HINT, formatDate } from './stock-format'
import { targetPath } from './stock-paths'

type DueListProps = Readonly<{ due: DueUnits }>

// Bald fällig (UX-Konzept §8.2, #125): Zähler als Sprungmarken, Gruppen nach Zeitraum, je Eintrag
// „Verbraucht“. Leere Gruppen fallen weg. Der Hinweis zum MHD steht einmal unter „Abgelaufen“.
export function DueList({ due }: DueListProps) {
  return (
    <>
      <ChipRow label="Zu Zeitraum springen">
        {due.groups.map(({ group }) => (
          <Chip key={group} href={`#${dueGroupAnchor(group)}`}>
            {dueCounterLabel(group, due.counts[group], due.thresholds)}
          </Chip>
        ))}
      </ChipRow>
      {due.groups.map(({ group, entries }) => (
        <section key={group} className="scroll-mt-4">
          <GroupHeader id={dueGroupAnchor(group)} trailing={DUE_GROUP_TONE[group]}>
            {dueGroupTitle(group, due.thresholds)}
          </GroupHeader>
          <Group labelledBy={dueGroupAnchor(group)}>
            {entries.map((entry) => {
              const [firstUnit] = entry.unitIds
              return (
                <Row
                  key={entry.unitIds.join(',')}
                  title={dueEntryTitle(entry)}
                  subtitle={dueEntryLine(entry)}
                  action={{ href: targetPath(entry.target) }}
                  accessory={
                    firstUnit === undefined ? undefined : (
                      <ConsumeButton
                        unitId={firstUnit}
                        name={entry.name}
                        dateLabel={
                          entry.bestBefore === null ? undefined : formatDate(entry.bestBefore)
                        }
                      />
                    )
                  }
                />
              )
            })}
          </Group>
          {group === 'expired' ? (
            <p className="px-8 pt-2 text-footnote text-fg2 breit:px-10">{BEST_BEFORE_HINT}</p>
          ) : null}
        </section>
      ))}
    </>
  )
}
