import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import type { DueUnits } from '../schemas/due'
import { DueEntryRow } from './DueEntryRow'
import { DUE_GROUP_TONE, dueCounterLabel, dueGroupAnchor, dueGroupTitle } from './due-labels'
import { BEST_BEFORE_HINT } from './stock-format'

type DueListProps = Readonly<{ due: DueUnits }>

// Bald fällig (UX-Konzept §8.2, #125): Zähler als Sprungmarken, Gruppen nach Zeitraum, je Eintrag
// „Verbraucht“, unter „Abgelaufen“ dazu „Entsorgt“ und „Noch gut“ (#47). Leere Gruppen fallen
// weg. Der Hinweis zum MHD steht einmal unter „Abgelaufen“, wenn dort ein MHD steht; ein
// Verbrauchsdatum warnt in seiner Zeile (#294).
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
            {entries.map((entry) => (
              <DueEntryRow
                key={entry.unitIds.join(',')}
                entry={entry}
                isExpired={group === 'expired'}
              />
            ))}
          </Group>
          {group === 'expired' && entries.some((entry) => entry.kind === 'best-before') ? (
            <p className="px-8 pt-2 text-footnote text-fg2 breit:px-10">{BEST_BEFORE_HINT}</p>
          ) : null}
        </section>
      ))}
    </>
  )
}
