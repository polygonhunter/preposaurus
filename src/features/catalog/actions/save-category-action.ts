'use server'
// Eigene Kategorie anlegen oder ändern (#76), nur der Admin. Neue Kategorien öffnen danach ihre
// Seite, damit gleich die erste Lebensmittelart darin folgen kann.
import { redirect } from 'next/navigation'
import { refresh } from 'next/cache'
import { z } from 'zod'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { categoryPath } from '@/shared/config/settings-paths'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { catalogServices } from '../application/catalog-services'
import { saveCategory, type CategoryError } from '../application/categories'
import { catalogIdSchema, categoryFormSchema } from '../schemas'
import { entryFormError, readFields, type EntryFormState } from './entry-form-state'

type CategoryField = 'name' | 'productGroupId'

export type CategoryFormState = EntryFormState<CategoryField>

const FIELDS: Record<CategoryField, string> = { name: 'name', productGroupId: 'warengruppe' }

const GONE = 'Diese Kategorie gibt es nicht mehr. Bitte lade die Seite neu.'

function problemOf(error: CategoryError) {
  switch (error.kind) {
    case 'duplicate':
      return {
        errors: {
          name: error.isHidden
            ? 'Diese Kategorie gibt es schon, sie ist ausgeblendet.'
            : 'Diese Kategorie gibt es schon.',
        },
      }
    case 'unknown-group':
      return { errors: { productGroupId: 'Bitte eine Warengruppe wählen.' } }
    case 'system-not-editable':
      return { message: 'Kategorien der Startliste lassen sich nur ausblenden.' }
    case 'not-found':
      return { message: GONE }
  }
}

export async function saveCategoryAction(
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const values = readFields(formData, FIELDS)
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return entryFormError(values, { message: adminAccessMessage(admin.error) })
  const rawId = readFormText(formData, 'id')
  const id = rawId === '' ? null : catalogIdSchema.safeParse(rawId).data
  if (id === undefined) return entryFormError(values, { message: GONE })
  const parsed = categoryFormSchema.safeParse(values)
  if (!parsed.success) {
    return entryFormError(values, {
      errors: firstMessages(z.flattenError(parsed.error).fieldErrors),
    })
  }
  const result = await saveCategory(await catalogServices(), {
    householdId: admin.value.householdId,
    id,
    input: parsed.data,
  })
  if (!result.ok) return entryFormError(values, problemOf(result.error))
  if (id === null) redirect(categoryPath(result.value.id))
  refresh()
  return { status: 'saved', errors: {}, message: 'Gespeichert.', values }
}
