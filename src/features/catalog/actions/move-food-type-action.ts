'use server'
// Eigene Lebensmittelart innerhalb ihrer Kategorie eine Stelle nach oben oder unten rücken (#243),
// nur der Admin. Die Reihenfolge gilt hier, im Vorrat und in Nachkaufen. Ohne Admin-Recht, bei
// einer System-Art oder einer fremden ID ändert sich nichts.
import { refresh } from 'next/cache'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { catalogServices } from '../application/catalog-services'
import { moveFoodType } from '../application/food-types'
import { readDirection, readId } from './read-catalog-form'

export async function moveFoodTypeAction(formData: FormData): Promise<void> {
  const admin = await requireHouseholdAdmin()
  const id = readId(formData)
  const direction = readDirection(formData)
  if (!admin.ok || id === null || direction === null) return
  await moveFoodType(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
    direction,
  })
  refresh()
}
