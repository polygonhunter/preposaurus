import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hideStorageLocationAction } from '@/features/catalog/actions/hide-storage-location-action'
import { removeStorageLocationAction } from '@/features/catalog/actions/remove-storage-location-action'
import { renameStorageLocationAction } from '@/features/catalog/actions/rename-storage-location-action'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { findStorageLocation } from '@/features/catalog/application/storage-locations'
import { catalogIdSchema } from '@/features/catalog/schemas'
import { productCountLabel } from '@/features/catalog/ui/catalog-labels'
import { HideToggleForm } from '@/features/catalog/ui/HideToggleForm'
import { NameForm } from '@/features/catalog/ui/NameForm'
import { RemoveEntryButton } from '@/features/catalog/ui/RemoveEntryButton'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { STORAGE_LOCATIONS_PATH } from '@/shared/config/settings-paths'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Lagerort bearbeiten · Preposaurus' }

// Einen Lagerort umbenennen, aus- oder einblenden und, wenn kein Produkt dort liegt, löschen (#77).
// Nur für den Admin. Eine fremde oder unbekannte ID findet nichts, weil das Repository auf den
// Haushalt filtert.
export default async function StorageLocationPage({
  params,
}: PageProps<'/einstellungen/lagerorte/[id]'>) {
  const { householdId } = await requirePageHouseholdAdmin()
  const parsed = catalogIdSchema.safeParse((await params).id)
  if (!parsed.success) notFound()
  const location = await findStorageLocation(await catalogServices(), {
    householdId,
    id: parsed.data,
  })
  if (location === null) notFound()
  const isUnused = location.productCount === 0
  return (
    <>
      <PageHeader
        title={location.name}
        subtitle={productCountLabel(location.productCount)}
        back={{ href: STORAGE_LOCATIONS_PATH, label: 'Lagerorte' }}
      />
      <GroupHeader id="name">Name</GroupHeader>
      <NameForm
        action={renameStorageLocationAction}
        label="Name des Lagerorts"
        submitLabel="Speichern"
        entry={location}
      />
      <GroupHeader id="sichtbarkeit">{location.isHidden ? 'Ausgeblendet' : 'Sichtbar'}</GroupHeader>
      <HideToggleForm
        id={location.id}
        isHidden={location.isHidden}
        action={hideStorageLocationAction}
      />
      <GroupFooter>
        Ein ausgeblendeter Ort steht beim Erfassen und im Filter nicht mehr zur Wahl. An den
        Produkten bleibt er stehen.
      </GroupFooter>
      <GroupHeader id="loeschen">Löschen</GroupHeader>
      {isUnused ? (
        <RemoveEntryButton
          id={location.id}
          name={location.name}
          action={removeStorageLocationAction}
          label="Lagerort löschen"
        />
      ) : null}
      <GroupFooter>
        {isUnused
          ? 'Hier liegt kein Produkt, der Ort lässt sich löschen.'
          : 'Löschen geht nur, wenn hier kein Produkt liegt, auch kein verbrauchtes. Sonst verlöre der Verlauf seinen Ort. Blendet ihn stattdessen aus.'}
      </GroupFooter>
    </>
  )
}
