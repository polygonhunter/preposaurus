'use server'
// Lagerort eine Stelle nach oben oder unten rücken (#77), nur der Admin. Die Reihenfolge gilt beim
// Erfassen und im Filter. Ohne Admin-Recht oder bei einer fremden ID ändert sich nichts.
import { refresh } from 'next/cache'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { catalogServices } from '../application/catalog-services'
import { moveStorageLocation } from '../application/storage-locations'
import { readDirection, readId } from './read-catalog-form'

export async function moveStorageLocationAction(formData: FormData): Promise<void> {
  const admin = await requireHouseholdAdmin()
  const id = readId(formData)
  const direction = readDirection(formData)
  if (!admin.ok || id === null || direction === null) return
  await moveStorageLocation(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
    direction,
  })
  refresh()
}
