import type { ReactNode } from 'react'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { listStorageLocations } from '@/features/catalog/application/storage-locations'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { goalServices } from '@/features/supply/application/goal-services'
import { getGoalSettings } from '@/features/supply/application/goal-settings'
import { formatGoalSummary } from '@/features/supply/ui/goal-format'
import { SignOutButton } from '@/features/auth/ui/SignOutButton'
import { ROLE_LABELS } from '@/features/auth/ui/user-format'
import { SettingsOverview, type SettingsSummary } from '@/features/settings/ui/SettingsOverview'
import { SettingsSplit } from '@/features/settings/ui/SettingsSplit'
import { requirePageHousehold } from '@/server/auth/household'

type SettingsLayoutProps = Readonly<{ children: ReactNode }>

async function loadSettingsSummary(): Promise<SettingsSummary> {
  const { householdId, username, isAdmin } = await requirePageHousehold()
  const [household, goal, locations] = await Promise.all([
    getHousehold(await householdServices(), householdId),
    getGoalSettings(await goalServices(), householdId),
    listStorageLocations(await catalogServices(), householdId),
  ])
  return {
    username,
    roleLabel: ROLE_LABELS[isAdmin ? 'admin' : 'mitglied'],
    isAdmin,
    memberCount: household.members.length,
    goalSummary: formatGoalSummary(goal),
    locationCount: locations.filter((location) => !location.isHidden).length,
    stillGoodCounts: household.rules.stillGoodCounts,
  }
}

// Rahmen der Einstellungen (#37, M12-06): kompakt ist die Liste die Seite /einstellungen, ab „breit“
// steht sie neben jedem Bereich. Jede Action ruft refresh(), so stehen die Werte der Liste nach dem
// Speichern gleich richtig da. Die Seiten prüfen Sitzung und Rolle trotzdem selbst.
export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const summary = await loadSettingsSummary()
  return (
    <SettingsSplit list={<SettingsOverview summary={summary} signOut={<SignOutButton />} />}>
      {children}
    </SettingsSplit>
  )
}
