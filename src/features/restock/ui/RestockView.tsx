import { EmptyState } from '@/shared/ui/EmptyState'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import type { RestockListDto } from '../schemas'
import { AddItemForm } from './AddItemForm'
import { GapSection } from './GapSection'
import { HiddenGapSection } from './HiddenGapSection'
import { ItemSection } from './ItemSection'
import { RestockProvider } from './RestockProvider'
import { RESTOCK_PATHS } from './restock-paths'
import { emptyListText, NO_GOAL_TEXT } from './restock-text'

type RestockViewProps = Readonly<{ list: RestockListDto }>

const GOAL_ACTION = { href: RESTOCK_PATHS.goalSettings, label: 'Ziel setzen' }

// Lesespalte wie der Bereich der Einstellungen: Ab „breit“ liegen Name und Menge höchstens 768 px
// auseinander, links ausgerichtet (#288). Auf dem Duo quer (951 px) greift die Grenze noch nicht.
const READING_COLUMN = 'breit:max-w-3xl'

// Seite Nachkaufen (UX-Konzept §8.6): Fehlt bis zum Ziel · Ersetzen · Eigene Einträge · Eintrag
// ergänzen · Erledigt · Ausgeblendet (#201). Leer steht oben nur ein Satz.
export function RestockView({ list }: RestockViewProps) {
  const empty = emptyListText(list)
  const showsGoalHint = empty === null && !list.isGoalCalculable
  return (
    <RestockProvider>
      <div className={READING_COLUMN}>
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
        <ItemSection
          id="ersetzen"
          title="Ersetzen"
          items={list.replace}
          suggestions={list.suggestions}
        />
        <ItemSection id="eigene-eintraege" title="Eigene Einträge" items={list.own} />
        <AddItemForm />
        <ItemSection id="erledigt" title="Erledigt" items={list.done} />
        <HiddenGapSection list={list} />
      </div>
    </RestockProvider>
  )
}
