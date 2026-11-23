'use server'
// Lagerort umbenennen (#77), nur der Admin. Der neue Name gilt sofort überall, auch an den
// Produkten, die dort liegen. Danach geht es zurück zur Liste.
import { redirect } from 'next/navigation'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { STORAGE_LOCATIONS_PATH } from '@/shared/config/settings-paths'
import { readFormText } from '@/shared/lib/form-data'
import { catalogServices } from '../application/catalog-services'
import { renameStorageLocation } from '../application/storage-locations'
import { formMessageError, nameFieldError, type NameFormState } from './catalog-form-state'
import { readId, readName } from './read-catalog-form'
import { LOCATION_GONE, locationNameError } from './storage-location-messages'

export async function renameStorageLocationAction(
  _previous: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  const typed = readFormText(formData, 'name')
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return formMessageError(typed, adminAccessMessage(admin.error))
  const id = readId(formData)
  if (id === null) return formMessageError(typed, LOCATION_GONE)
  const parsed = readName(formData)
  if (!parsed.ok) return nameFieldError(typed, parsed.error)
  const result = await renameStorageLocation(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
    name: parsed.name,
  })
  if (!result.ok) {
    return result.error.kind === 'not-found'
      ? formMessageError(typed, LOCATION_GONE)
      : nameFieldError(typed, locationNameError(result.error))
  }
  redirect(STORAGE_LOCATIONS_PATH)
}
