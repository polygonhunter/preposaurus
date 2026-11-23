import { EmptyState } from '@/shared/ui/EmptyState'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import type { RestockListDto } from '../schemas'
import { AddItemForm } from './AddItemForm'
import { GapSection } from './GapSection'
import { ItemSection } from './ItemSection'
import { RestockProvider } from './RestockProvider'
import { RESTOCK_PATHS } from './restock-paths'
import { emptyListText, NO_GOAL_TEXT } from './restock-text'

type RestockViewProps = Readonly<{ list: RestockListDto }>

const GOAL_ACTION = { href: RESTOCK_PATHS.goalSettings, label: 'Ziel setzen' }

// Seite Nachkaufen (UX-Konzept §8.6): Fehlt bis zum Ziel · Ersetzen · Eigene Einträge · Erledigt,
// darunter „Eintrag ergänzen“. Leer steht nur ein Satz da.
export function RestockView({ list }: RestockViewProps) {
  const empty = emptyListText(list)
  const showsGoalHint = empty === null && !list.isGoalCalculable
  return (
    <RestockProvider>
      {empty === null ? null : (
        <EmptyState text={empty} {...(list.isGoalCalculable ? {} : { action: GOAL_ACTION })} />
      )}
      {showsGoalHint ? (
        <div className="pt-[22px]">
          <Group>
            <Row title={NO_GOAL_TEXT} action={{ href: RESTOCK_PATHS.goalSettings }} />
          </Group>
        </div>
      ) : null}
      <GapSection list={list} />
      <ItemSection id="ersetzen" title="Ersetzen" items={list.replace} />
      <ItemSection id="eigene-eintraege" title="Eigene Einträge" items={list.own} />
      <AddItemForm />
      <ItemSection id="erledigt" title="Erledigt" items={list.done} />
    </RestockProvider>
  )
}
