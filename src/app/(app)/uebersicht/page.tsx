import { redirect } from 'next/navigation'
import { loadOverview } from '@/features/supply/application/load-overview'
import { OverviewView } from '@/features/supply/ui/OverviewView'
import { requireHouseholdUser } from '@/server/auth/guards'
import { IconLink } from '@/shared/ui/IconLink'
import { InstallHint } from '@/shared/ui/InstallHint'
import { OfflineNotice } from '@/shared/ui/OfflineNotice'
import { PageHeader } from '@/shared/ui/PageHeader'

// Startseite (UX-Konzept §8.1): Lage und nächster Schritt in fünf Sekunden. Gerechnet wird im
// Use-Case, die Seite holt nur den Haushalt der Sitzung und zeigt das DTO. Ohne Verbindung zeigt
// der Service Worker den zuletzt geladenen Stand, OfflineNotice sagt, von wann (M10-02).
export default async function OverviewPage() {
  const access = await requireHouseholdUser()
  if (!access.ok) redirect('/anmelden')
  const overview = await loadOverview(access.value.householdId)
  return (
    <>
      <PageHeader
        title="Übersicht"
        action={<IconLink href="/einstellungen" icon="gear" label="Einstellungen" />}
      />
      <OfflineNotice loadedAt={new Date().toISOString()} />
      <InstallHint />
      <OverviewView overview={overview} />
    </>
  )
}
