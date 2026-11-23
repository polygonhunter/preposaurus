import type { Metadata } from 'next'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { AmpelForm } from '@/features/household/ui/AmpelForm'
import { StillGoodForm } from '@/features/household/ui/StillGoodForm'
import { ampelServices } from '@/features/inventory/application/ampel-services'
import { getAmpelThresholds } from '@/features/inventory/application/ampel-thresholds'
import { requirePageHousehold } from '@/server/auth/household'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Vorrat und Regeln · Preposaurus' }

const days = (count: number) => (count === 1 ? '1 Tag' : `${String(count)} Tage`)

const AMPEL_EXPLANATION =
  'Die Ampel zählt die Tage bis zum MHD. Gelb heißt bald fällig, orange heißt dringend, rot heißt abgelaufen. „Diese Woche“ umfasst immer 7 Tage, deshalb gilt Orange mindestens für die letzten 7 Tage. Vorrat, Übersicht und „Bald fällig“ zeigen neue Werte sofort.'

// Regeln des Vorrats: Ampel-Schwellen (EIN-05, #78) und „Noch gut zählt mit“ (#117). Der Admin
// ändert, Mitglieder sehen die Werte nur lesend.
export default async function RulesPage() {
  const { householdId, isAdmin } = await requirePageHousehold()
  const [{ rules }, thresholds] = await Promise.all([
    getHousehold(await householdServices(), householdId),
    getAmpelThresholds(await ampelServices(), householdId),
  ])
  return (
    <>
      <PageHeader
        title="Vorrat und Regeln"
        back={{ href: SETTINGS_PATH, label: 'Einstellungen' }}
      />
      <GroupHeader id="ampel">Ampel</GroupHeader>
      {isAdmin ? (
        <AmpelForm thresholds={thresholds} labelledBy="ampel" />
      ) : (
        <Group labelledBy="ampel">
          <Row title="Gelb, bald fällig" trailing={`ab ${days(thresholds.soonDays)}`} />
          <Row title="Orange, dringend" trailing={`ab ${days(thresholds.urgentDays)}`} />
        </Group>
      )}
      <GroupFooter>{AMPEL_EXPLANATION}</GroupFooter>
      <GroupHeader id="noch-gut">Abgelaufen, aber noch gut</GroupHeader>
      {isAdmin ? (
        <StillGoodForm isOn={rules.stillGoodCounts} labelledBy="noch-gut" />
      ) : (
        <Group labelledBy="noch-gut">
          <Row title="„Noch gut“ zählt mit" trailing={rules.stillGoodCounts ? 'an' : 'aus'} />
        </Group>
      )}
      {isAdmin ? null : <GroupFooter>Das ändert ein Admin.</GroupFooter>}
    </>
  )
}
