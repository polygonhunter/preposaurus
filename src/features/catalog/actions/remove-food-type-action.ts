'use server'
// Eigene Lebensmittelart löschen (#126), nur der Admin und nur ohne Produkte (auch verbrauchte).
// System-Arten lassen sich nie löschen (das Repository trifft nur eigene). Danach geht es zur
// Liste der Arten.
import { redirect } from 'next/navigation'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { FOOD_TYPES_PATH } from '@/shared/config/settings-paths'
import { catalogServices } from '../application/catalog-services'
import { removeFoodType } from '../application/food-types'
import type { RemoveState } from './catalog-form-state'
import { readId } from './read-catalog-form'

const GONE = 'Diese Lebensmittelart gibt es nicht mehr. Bitte lade die Seite neu.'
const IN_USE = 'Es gibt noch Produkte dieser Art. Blendet sie stattdessen aus.'

export async function removeFoodTypeAction(
  _previous: RemoveState,
  formData: FormData,
): Promise<RemoveState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return { message: adminAccessMessage(admin.error) }
  const id = readId(formData)
  if (id === null) return { message: GONE }
  const result = await removeFoodType(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
  })
  if (!result.ok) return { message: result.error.kind === 'in-use' ? IN_USE : GONE }
  redirect(FOOD_TYPES_PATH)
}
