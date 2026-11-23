import type { Metadata } from 'next'
import { addStorageLocationAction } from '@/features/catalog/actions/add-storage-location-action'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { listStorageLocations } from '@/features/catalog/application/storage-locations'
import { NameForm } from '@/features/catalog/ui/NameForm'
import { StorageLocationList } from '@/features/catalog/ui/StorageLocationList'
import { requirePageHousehold } from '@/server/auth/household'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { EmptyState } from '@/shared/ui/EmptyState'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Lagerorte · Preposaurus' }

// Lagerorte des Haushalts (#77, EIN-04). Der Admin legt an, sortiert und öffnet einen Ort zum
// Umbenennen, Ausblenden oder Löschen. Mitglieder sehen dieselbe Liste nur lesend.
export default async function StorageLocationsPage() {
  const { householdId, isAdmin } = await requirePageHousehold()
  const locations = await listStorageLocations(await catalogServices(), householdId)
  const visible = locations.filter((location) => !location.isHidden)
  const hidden = locations.filter((location) => location.isHidden)
  return (
    <>
      <PageHeader title="Lagerorte" back={{ href: SETTINGS_PATH, label: 'Einstellungen' }} />
      <GroupHeader id="lagerorte">Zur Wahl beim Erfassen</GroupHeader>
      {visible.length === 0 ? (
        <EmptyState text="Noch keine Lagerorte. Ohne Lagerort geht es auch, mit findet ihr alles schneller." />
      ) : (
        <StorageLocationList locations={visible} labelledBy="lagerorte" canEdit={isAdmin} />
      )}
      <GroupFooter>
        Der Lagerort steht am Produkt. In dieser Reihenfolge erscheinen die Orte beim Erfassen und
        im Filter.{isAdmin ? null : ' Das ändert ein Admin.'}
      </GroupFooter>
      {isAdmin ? (
        <>
          <GroupHeader id="neuer-lagerort">Neuer Lagerort</GroupHeader>
          <NameForm
            action={addStorageLocationAction}
            label="Name, z. B. Keller oder Vorratsschrank"
            submitLabel="Hinzufügen"
          />
        </>
      ) : null}
      {hidden.length > 0 ? (
        <>
          <GroupHeader id="ausgeblendet">Ausgeblendet</GroupHeader>
          <StorageLocationList locations={hidden} labelledBy="ausgeblendet" canEdit={isAdmin} />
          <GroupFooter>
            Stehen beim Erfassen nicht mehr zur Wahl. An den Produkten bleiben sie stehen.
          </GroupFooter>
        </>
      ) : null}
    </>
  )
}
