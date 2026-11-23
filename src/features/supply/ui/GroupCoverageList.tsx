import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import type { OverviewGroup } from '../schemas'
import { GroupCoverageItem } from './GroupCoverageItem'
import { scaleFor } from './head-text'

type GroupCoverageListProps = Readonly<{ groups: readonly OverviewGroup[] }>

const HEADING_ID = 'warengruppen'

// Abdeckung je Warengruppe (UX-Konzept A9, #69): „X von Y Tagen“ als Balken, Wasser steht als
// zweiter Balken oben. Die knappste Gruppe trägt das Wort, nicht nur die Farbe. Tippen öffnet den
// Vorrat dieser Warengruppe.
export function GroupCoverageList({ groups }: GroupCoverageListProps) {
  const goalDays = groups[0]?.goalDays ?? null
  const scaleDays = scaleFor(
    groups.map((group) => group.days),
    goalDays,
  )
  return (
    <section aria-labelledby={HEADING_ID}>
      <GroupHeader id={HEADING_ID}>Warengruppen</GroupHeader>
      <Group labelledBy={HEADING_ID}>
        {groups.map((group) => (
          <GroupCoverageItem key={group.key} group={group} scaleDays={scaleDays} />
        ))}
      </Group>
    </section>
  )
}
