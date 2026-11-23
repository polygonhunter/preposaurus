'use server'
// Lebensmittelart für diesen Haushalt aus- oder einblenden (#126), nur der Admin, auch System-Arten.
// Ausgeblendet erscheint sie nicht mehr in der Erfassen-Suche und nicht im Enum der Foto-Erkennung,
// Produkte darauf bleiben sichtbar und zählen weiter.
import { refresh } from 'next/cache'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { catalogServices } from '../application/catalog-services'
import { setFoodTypeHidden } from '../application/food-types'
import { readHidden, readId } from './read-catalog-form'

export async function hideFoodTypeAction(formData: FormData): Promise<void> {
  const admin = await requireHouseholdAdmin()
  const id = readId(formData)
  if (!admin.ok || id === null) return
  await setFoodTypeHidden(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
    isHidden: readHidden(formData),
  })
  refresh()
}
