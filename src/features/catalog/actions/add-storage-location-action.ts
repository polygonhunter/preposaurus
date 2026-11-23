'use server'
// Lagerort anlegen (#77), nur der Admin, geprüft bei jedem Aufruf. Danach zeigt die Seite die neue
// Liste, das Feld ist wieder leer für den nächsten Ort.
import { refresh } from 'next/cache'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import { addStorageLocation } from '../application/storage-locations'
import { catalogServices } from '../application/catalog-services'
import { formMessageError, nameFieldError, type NameFormState } from './catalog-form-state'
import { readName } from './read-catalog-form'
import { locationNameError } from './storage-location-messages'

export async function addStorageLocationAction(
  _previous: NameFormState,
  formData: FormData,
): Promise<NameFormState> {
  const typed = readFormText(formData, 'name')
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return formMessageError(typed, adminAccessMessage(admin.error))
  const parsed = readName(formData)
  if (!parsed.ok) return nameFieldError(typed, parsed.error)
  const result = await addStorageLocation(await catalogServices(), {
    householdId: admin.value.householdId,
    name: parsed.name,
  })
  if (!result.ok) return nameFieldError(typed, locationNameError(result.error))
  refresh()
  return { status: 'saved', fieldError: null, message: `„${parsed.name}“ ist angelegt.`, name: '' }
}
