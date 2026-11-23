import { redirect } from 'next/navigation'
import { loadOverview } from '@/features/supply/application/load-overview'
import { OverviewView } from '@/features/supply/ui/OverviewView'
import { requireHouseholdUser } from '@/server/auth/guards'
import { IconLink } from '@/shared/ui/IconLink'
import { PageHeader } from '@/shared/ui/PageHeader'

// Startseite (UX-Konzept §8.1): Lage und nächster Schritt in fünf Sekunden. Gerechnet wird im
// Use-Case, die Seite holt nur den Haushalt der Sitzung und zeigt das DTO.
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
      <OverviewView overview={overview} />
    </>
  )
}
