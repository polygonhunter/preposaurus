'use server'
// Kategorie für diesen Haushalt aus- oder einblenden (#76), nur der Admin, auch System-Kategorien.
// Ihre Arten stehen dann beim Erfassen und für die Foto-Erkennung nicht mehr zur Wahl, Produkte
// darin bleiben sichtbar und zählen weiter. Ohne Recht oder bei fremder ID ändert sich nichts.
import { refresh } from 'next/cache'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { catalogServices } from '../application/catalog-services'
import { setCategoryHidden } from '../application/categories'
import { readHidden, readId } from './read-catalog-form'

export async function hideCategoryAction(formData: FormData): Promise<void> {
  const admin = await requireHouseholdAdmin()
  const id = readId(formData)
  if (!admin.ok || id === null) return
  await setCategoryHidden(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
    isHidden: readHidden(formData),
  })
  refresh()
}
