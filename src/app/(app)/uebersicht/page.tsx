import { redirect } from 'next/navigation'
import { openSetupPath } from '@/features/auth/application/setup-step-request'
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
// Ist die Einrichtung noch offen, geht es für den Admin, der eingerichtet hat, dort weiter (#40):
// Mit „Angemeldet bleiben“ kommt er sonst nie über die Anmeldung zurück.
export default async function OverviewPage() {
  const access = await requireHouseholdUser()
  if (!access.ok) redirect('/anmelden')
  const setupPath = await openSetupPath(access.value.id)
  if (setupPath !== null) redirect(setupPath)
  const overview = await loadOverview(access.value.householdId)
  return (
    <>
      <PageHeader
        title="Übersicht"
        action={
          // Ab „breit“ steht „Einstellungen“ in der Seitenleiste, ein zweites Ziel wäre doppelt (#218)
          <span className="breit:hidden">
            <IconLink href="/einstellungen" icon="gear" label="Einstellungen" />
          </span>
        }
      />
      <OfflineNotice loadedAt={new Date().toISOString()} />
      <InstallHint />
      <OverviewView overview={overview} />
    </>
  )
}
