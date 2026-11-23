'use server'
// Eigene Kategorie löschen (#76), nur der Admin und nur ohne Arten und Produkte. System-Kategorien
// lassen sich nie löschen (das Repository trifft nur eigene).
import { redirect } from 'next/navigation'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { CATEGORIES_PATH } from '@/shared/config/settings-paths'
import { catalogServices } from '../application/catalog-services'
import { removeCategory } from '../application/categories'
import type { RemoveState } from './catalog-form-state'
import { readId } from './read-catalog-form'

const GONE = 'Diese Kategorie gibt es nicht mehr. Bitte lade die Seite neu.'
const IN_USE = 'Darin stehen noch Lebensmittelarten oder Produkte. Blendet sie stattdessen aus.'

export async function removeCategoryAction(
  _previous: RemoveState,
  formData: FormData,
): Promise<RemoveState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return { message: adminAccessMessage(admin.error) }
  const id = readId(formData)
  if (id === null) return { message: GONE }
  const result = await removeCategory(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
  })
  if (!result.ok) return { message: result.error.kind === 'in-use' ? IN_USE : GONE }
  redirect(CATEGORIES_PATH)
}
