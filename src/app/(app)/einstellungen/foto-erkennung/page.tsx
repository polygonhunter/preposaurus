import type { Metadata } from 'next'
import { aiSettingsServices } from '@/features/ai-settings/application/ai-settings-services'
import { getAiSettingsOverview } from '@/features/ai-settings/application/get-ai-settings-overview'
import { suggestConnectionName } from '@/features/ai-settings/domain/connection-name'
import { AddConnectionForm } from '@/features/ai-settings/ui/AddConnectionForm'
import { AiEnabledForm } from '@/features/ai-settings/ui/AiEnabledForm'
import { AiStatusGroup } from '@/features/ai-settings/ui/AiStatusGroup'
import { ConnectionCard } from '@/features/ai-settings/ui/ConnectionCard'
import { EnvConnectionCard } from '@/features/ai-settings/ui/EnvConnectionCard'
import { RoleAssignmentForm } from '@/features/ai-settings/ui/RoleAssignmentForm'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Foto-Erkennung · Preposaurus' }

// Foto-Erkennung (#108, #79) unter Daten & System, nur für den Admin: Schalter, Status,
// Verbindungen mit Schlüssel und Modell je Rolle. Der Schlüssel kommt nie zurück zum Browser.
export default async function AiSettingsPage() {
  const { householdId } = await requirePageHouseholdAdmin()
  const overview = await getAiSettingsOverview(await aiSettingsServices(), householdId)
  const usable = overview.connections
    .filter(({ keyHint }) => keyHint !== null)
    .map(({ id, name }) => ({ id, name }))
  return (
    <>
      <PageHeader title="Foto-Erkennung" back={{ href: SETTINGS_PATH, label: 'Einstellungen' }} />
      <AiStatusGroup overview={overview} />
      <GroupHeader id="ki-schalter">Für den Haushalt</GroupHeader>
      <AiEnabledForm isOn={overview.isAiEnabled} />
      {overview.envConnection === null ? null : (
        <EnvConnectionCard provider={overview.envConnection} />
      )}
      {overview.connections.map((connection) => (
        <ConnectionCard key={connection.id} connection={connection} />
      ))}
      <GroupHeader id="ki-neu">Verbindung hinzufügen</GroupHeader>
      <AddConnectionForm
        defaultName={suggestConnectionName(overview.connections.map(({ name }) => name))}
      />
      <GroupHeader id="ki-rollen">Modell je Foto-Art</GroupHeader>
      {usable.length > 0 ? (
        <RoleAssignmentForm roles={overview.roles} connections={usable} />
      ) : (
        <GroupFooter>
          Modelle lassen sich wählen, sobald eine Verbindung mit Schlüssel da ist. Bis dahin gilt
          die Empfehlung, wie oben im Status zu sehen.
        </GroupFooter>
      )}
    </>
  )
}
