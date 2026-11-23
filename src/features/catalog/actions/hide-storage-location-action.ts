'use server'
// Lagerort aus- oder wieder einblenden (#77), nur der Admin. Ausgeblendet steht er beim Erfassen
// und im Filter nicht mehr zur Wahl, an den Produkten bleibt er stehen. Ohne Admin-Recht oder bei
// einer fremden ID ändert sich nichts, die Seite zeigt dann einfach den alten Stand.
import { refresh } from 'next/cache'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { catalogServices } from '../application/catalog-services'
import { setStorageLocationHidden } from '../application/storage-locations'
import { readHidden, readId } from './read-catalog-form'

export async function hideStorageLocationAction(formData: FormData): Promise<void> {
  const admin = await requireHouseholdAdmin()
  const id = readId(formData)
  if (!admin.ok || id === null) return
  await setStorageLocationHidden(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
    isHidden: readHidden(formData),
  })
  refresh()
}
