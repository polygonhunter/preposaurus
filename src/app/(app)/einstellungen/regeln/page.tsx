import type { Metadata } from 'next'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { StillGoodForm } from '@/features/household/ui/StillGoodForm'
import { requirePageHousehold } from '@/server/auth/household'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Vorrat und Regeln · Preposaurus' }

// Regeln des Vorrats (#117): „Noch gut zählt mit“, Standard aus. Weitere Regeln (Ampel-Schwellen)
// kommen mit M9 dazu.
export default async function RulesPage() {
  const { householdId, isAdmin } = await requirePageHousehold()
  const { rules } = await getHousehold(await householdServices(), householdId)
  return (
    <>
      <PageHeader
        title="Vorrat und Regeln"
        back={{ href: SETTINGS_PATH, label: 'Einstellungen' }}
      />
      <GroupHeader id="noch-gut">Abgelaufen, aber noch gut</GroupHeader>
      {isAdmin ? (
        <StillGoodForm isOn={rules.stillGoodCounts} />
      ) : (
        <>
          <Group labelledBy="noch-gut">
            <Row title="„Noch gut“ zählt mit" trailing={rules.stillGoodCounts ? 'an' : 'aus'} />
          </Group>
          <GroupFooter>Das ändert ein Admin.</GroupFooter>
        </>
      )}
    </>
  )
}
