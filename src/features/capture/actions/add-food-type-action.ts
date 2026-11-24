'use server'
// Neue Lebensmittelart aus der Erfassung (#142, #110): Admin und Mitglied des Haushalts (#298).
// Name und Pflicht-Kategorie prüft dasselbe Schema wie in den Einstellungen. Die Antwort trägt die neue Art samt Pfad, damit das
// Formular sie ohne Neuladen wählen kann. Gibt es eine ähnliche Art schon, kommt sie als Angebot.
import { z } from 'zod'
import { foodTypeFormSchema } from '@/features/catalog/schemas'
import { requireHouseholdUser } from '@/server/auth/guards'
import { firstMessages } from '@/shared/lib/form-data'
import { addFoodTypeForHousehold, type AddFoodTypeError } from '../application/add-food-type'
import type { FoodTypeChoice } from '../domain/capture-options'
import { accessMessage } from './action-messages'

type NewFoodTypeField = 'name' | 'categoryId'

export type AddFoodTypeOutcome =
  | { ok: true; foodType: FoodTypeChoice }
  | {
      ok: false
      errors: Partial<Record<NewFoodTypeField, string>>
      message: string | null
      /** Vorhandene Art mit diesem Namen oder Suchwort: wählen statt doppelt anlegen */
      similar: FoodTypeChoice | null
    }

const inputSchema = foodTypeFormSchema.pick({ name: true, categoryId: true })

const failure = (
  problem: Partial<Omit<Extract<AddFoodTypeOutcome, { ok: false }>, 'ok'>>,
): AddFoodTypeOutcome => ({ ok: false, errors: {}, message: null, similar: null, ...problem })

const GONE = 'Das hat nicht geklappt. Bitte ladet die Seite neu.'

function problemOf(error: AddFoodTypeError): AddFoodTypeOutcome {
  switch (error.kind) {
    case 'similar':
      return failure({ similar: error.foodType })
    case 'duplicate':
      return failure({
        errors: {
          name: error.isHidden
            ? 'Diese Lebensmittelart gibt es schon, sie ist ausgeblendet. Ein Admin kann sie in den Einstellungen wieder einblenden.'
            : 'Diese Lebensmittelart gibt es schon.',
        },
      })
    case 'unknown-category':
      return failure({ errors: { categoryId: 'Bitte eine Kategorie wählen.' } })
    case 'not-found':
    case 'system-not-editable':
      return failure({ message: GONE })
  }
}

export async function addFoodTypeAction(input: {
  name: string
  categoryId: string
}): Promise<AddFoodTypeOutcome> {
  const user = await requireHouseholdUser()
  if (!user.ok) return failure({ message: accessMessage(user.error) })
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    return failure({ errors: firstMessages(z.flattenError(parsed.error).fieldErrors) })
  }
  const result = await addFoodTypeForHousehold({
    householdId: user.value.householdId,
    ...parsed.data,
  })
  return result.ok ? { ok: true, foodType: result.value } : problemOf(result.error)
}
