'use server'
// Eigene Lebensmittelart anlegen oder ändern (#126), nur der Admin. Danach steht sie sofort in der
// Erfassen-Suche, auch über ihre Suchwörter, und im Enum der Foto-Erkennung.
import { redirect } from 'next/navigation'
import { refresh } from 'next/cache'
import { z } from 'zod'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { foodTypePath } from '@/shared/config/settings-paths'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { catalogServices } from '../application/catalog-services'
import { saveFoodType, type FoodTypeError } from '../application/food-types'
import { catalogIdSchema, foodTypeFormSchema } from '../schemas'
import { entryFormError, readFields, type EntryFormState } from './entry-form-state'

type FoodTypeField = 'name' | 'categoryId' | 'searchTerms' | 'kcalPer100'

export type FoodTypeFormState = EntryFormState<FoodTypeField>

const FIELDS: Record<FoodTypeField, string> = {
  name: 'name',
  categoryId: 'kategorie',
  searchTerms: 'suchwoerter',
  kcalPer100: 'kcal',
}

const GONE = 'Diese Lebensmittelart gibt es nicht mehr. Bitte lade die Seite neu.'

function problemOf(error: FoodTypeError) {
  switch (error.kind) {
    case 'duplicate':
      return {
        errors: {
          name: error.isHidden
            ? 'Diese Lebensmittelart gibt es schon, sie ist ausgeblendet.'
            : 'Diese Lebensmittelart gibt es schon.',
        },
      }
    case 'unknown-category':
      return { errors: { categoryId: 'Bitte eine Kategorie wählen.' } }
    case 'system-not-editable':
      return { message: 'Arten der Startliste lassen sich nur ausblenden.' }
    case 'not-found':
      return { message: GONE }
  }
}

export async function saveFoodTypeAction(
  _previous: FoodTypeFormState,
  formData: FormData,
): Promise<FoodTypeFormState> {
  const values = readFields(formData, FIELDS)
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return entryFormError(values, { message: adminAccessMessage(admin.error) })
  const rawId = readFormText(formData, 'id')
  const id = rawId === '' ? null : catalogIdSchema.safeParse(rawId).data
  if (id === undefined) return entryFormError(values, { message: GONE })
  const parsed = foodTypeFormSchema.safeParse(values)
  if (!parsed.success) {
    return entryFormError(values, {
      errors: firstMessages(z.flattenError(parsed.error).fieldErrors),
    })
  }
  const result = await saveFoodType(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
    input: parsed.data,
  })
  if (!result.ok) return entryFormError(values, problemOf(result.error))
  if (id === null) redirect(foodTypePath(result.value.id))
  refresh()
  return { status: 'saved', errors: {}, message: 'Gespeichert.', values }
}
