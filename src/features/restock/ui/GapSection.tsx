import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { RestockListDto } from '../schemas'
import { GapCheckButton } from './GapCheckButton'
import { HideGapButton } from './HideGapButton'
import { formatGapAmount, gapSubtitle } from './restock-text'

type GapSectionProps = Readonly<{ list: RestockListDto }>

const HEADING_ID = 'fehlt-bis-zum-ziel'

// „Fehlt bis zum Ziel“ (A13): je Warengruppe die Menge und die Tage am Ziel, Wasser zuerst. Die
// Zeilen sind live gerechnet und verschwinden von selbst, sobald genug erfasst ist (#72). Abhaken
// und Ausblenden verdecken eine Lücke, bis sich die Lage ändert (#201). Beispiele aus den
// Lebensmittelarten machen die Menge greifbar (#202).
export function GapSection({ list }: GapSectionProps) {
  if (list.gaps.length === 0) return null
  return (
    <section aria-labelledby={HEADING_ID}>
      <GroupHeader id={HEADING_ID}>Fehlt bis zum Ziel</GroupHeader>
      <Group labelledBy={HEADING_ID}>
        {list.gaps.map((gap) => (
          <Row
            key={gap.groupKey}
            icon={<GapCheckButton gap={gap} />}
            title={gap.name}
            subtitle={gapSubtitle(gap)}
            trailing={<span className="font-semibold text-fg">{formatGapAmount(gap.missing)}</span>}
            accessory={
              <div className="-my-2 -mr-1 shrink-0">
                <HideGapButton gap={gap} />
              </div>
            }
          />
        ))}
      </Group>
    </section>
  )
}
