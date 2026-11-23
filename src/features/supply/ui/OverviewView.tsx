import { EmptyState } from '@/shared/ui/EmptyState'
import type { Overview } from '../schemas'
import { DueSection } from './DueSection'
import { GroupCoverageList } from './GroupCoverageList'
import { HouseholdSection } from './HouseholdSection'
import { OVERVIEW_PATHS } from './overview-paths'
import { RestockHint } from './RestockHint'
import { SupplyBlock } from './SupplyBlock'

type OverviewViewProps = Readonly<{ overview: Overview }>

// Leerzustand (UX-Konzept §7): ein Satz, eine Handlung.
const EMPTY_STOCK = {
  text: 'Noch nichts im Vorrat. Fangt mit einem Produkt an, das schon im Schrank steht.',
  action: { href: OVERVIEW_PATHS.capture, label: 'Erstes Produkt erfassen' },
}

// Übersicht (DESIGN_SYSTEM §7, UX-Konzept §8.1) in der Reihenfolge der Priorität: Heute versorgt mit
// Ziel und nächstem Schritt, Bald fällig, Nachkaufen, Warengruppen, Haushalt. Ab „breit“ eine Spalte
// mit begrenzter Breite, damit Balken und Zeilen lesbar bleiben. Ab „weit“ zweispaltig (#91): links
// Lage und Bald fällig, rechts Nachkaufen, Warengruppen und Haushalt, zusammen höchstens 1240 px.
export function OverviewView({ overview }: OverviewViewProps) {
  if (!overview.hasStock) {
    return (
      <>
        <EmptyState {...EMPTY_STOCK} />
        <HouseholdSection household={overview.household} goal={overview.goal} />
      </>
    )
  }
  return (
    <div className="breit:max-w-[760px] weit:grid weit:max-w-[1240px] weit:grid-cols-2 weit:items-start">
      <div>
        <SupplyBlock overview={overview} />
        <DueSection due={overview.due} />
      </div>
      <div>
        <RestockHint restock={overview.restock} />
        {overview.groups.length === 0 ? null : (
          <GroupCoverageList groups={overview.groups} source={overview.household.source} />
        )}
        <HouseholdSection household={overview.household} goal={overview.goal} />
      </div>
    </div>
  )
}
