import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { RestockListDto } from '../schemas'
import { ShowGapButton } from './ShowGapButton'
import { formatGapAmount, HIDDEN_GAP_RULE_TEXT } from './restock-text'

type HiddenGapSectionProps = Readonly<{ list: RestockListDto }>

const HEADING_ID = 'ausgeblendet'

// „Ausgeblendet“ (#201): Lücken, die gerade verdeckt sind, mit der aktuellen Fehlmenge. Hier holt
// ihr sie zurück; von selbst kommen sie wieder, wenn sich die Lage ändert (Satz darunter).
export function HiddenGapSection({ list }: HiddenGapSectionProps) {
  if (list.hiddenGaps.length === 0) return null
  return (
    <section aria-labelledby={HEADING_ID}>
      <GroupHeader id={HEADING_ID}>Ausgeblendet</GroupHeader>
      <Group labelledBy={HEADING_ID}>
        {list.hiddenGaps.map((gap) => (
          <Row
            key={gap.entryId}
            focusKey={`hidden-${gap.entryId}`}
            title={gap.name}
            subtitle={`Fehlen ${formatGapAmount(gap.missing)}`}
            accessory={
              <div className="-my-2 -mr-1 shrink-0">
                <ShowGapButton entry={{ id: gap.entryId, label: gap.name }} />
              </div>
            }
          />
        ))}
      </Group>
      <GroupFooter>{HIDDEN_GAP_RULE_TEXT}</GroupFooter>
    </section>
  )
}
