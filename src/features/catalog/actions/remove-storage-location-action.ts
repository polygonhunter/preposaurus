'use server'
// Lagerort löschen (#77), nur der Admin und nur, wenn kein Produkt dort liegt. Danach geht es zur
// Liste zurück.
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { SETTINGS_PATH, STORAGE_LOCATIONS_PATH } from '@/shared/config/settings-paths'
import { catalogServices } from '../application/catalog-services'
import { removeStorageLocation } from '../application/storage-locations'
import type { RemoveState } from './catalog-form-state'
import { readId } from './read-catalog-form'
import { LOCATION_GONE, LOCATION_IN_USE } from './storage-location-messages'

export async function removeStorageLocationAction(
  _previous: RemoveState,
  formData: FormData,
): Promise<RemoveState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return { message: adminAccessMessage(admin.error) }
  const id = readId(formData)
  if (id === null) return { message: LOCATION_GONE }
  const result = await removeStorageLocation(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
  })
  if (!result.ok)
    return { message: result.error.kind === 'in-use' ? LOCATION_IN_USE : LOCATION_GONE }
  // Die Liste der Einstellungen daneben (ab „breit“) zählt die Lagerorte
  revalidatePath(SETTINGS_PATH, 'layout')
  redirect(STORAGE_LOCATIONS_PATH)
}
