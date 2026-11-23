import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { OverviewRestock } from '../schemas'
import { restockText } from './list-text'
import { OVERVIEW_PATHS } from './overview-paths'

type RestockHintProps = Readonly<{ restock: OverviewRestock }>

const HEADING_ID = 'nachkaufen'

// Nachkaufen nur als kurzer Hinweis und nur, wenn es etwas gibt (#70). Die Liste selbst kommt mit M8.
export function RestockHint({ restock }: RestockHintProps) {
  const text = restockText(restock)
  if (text === null) return null
  return (
    <section aria-labelledby={HEADING_ID}>
      <GroupHeader id={HEADING_ID}>Nachkaufen</GroupHeader>
      <Group labelledBy={HEADING_ID}>
        <Row title={text} action={{ href: OVERVIEW_PATHS.restock }} />
      </Group>
    </section>
  )
}
