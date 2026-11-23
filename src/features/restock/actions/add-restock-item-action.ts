'use server'
// „Eintrag ergänzen“ auf der Seite Nachkaufen (#73, NK-03). Prüft Eingabe und Haushalt selbst,
// weil eine Action per POST direkt aufrufbar ist (CODE_PRINZIPIEN §7).
import { refresh } from 'next/cache'
import { z } from 'zod'
import { requireHouseholdUser } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import { addRestockItem } from '../application/change-restock-items'
import { restockRepository } from '../application/restock-services'
import { newRestockItemSchema } from '../schemas'
import { ACCESS_MESSAGE } from './restock-messages'

/** `added` zählt mit, damit das Formular nach jedem Erfolg das Feld leert. */
export type AddRestockItemState = Readonly<{ error: string | null; added: number }>

export async function addRestockItemAction(
  previous: AddRestockItemState,
  formData: FormData,
): Promise<AddRestockItemState> {
  const parsed = newRestockItemSchema.safeParse({ label: readFormText(formData, 'eintrag') })
  if (!parsed.success) {
    const message = z.flattenError(parsed.error).fieldErrors.label?.[0] ?? null
    return { error: message, added: previous.added }
  }
  const user = await requireHouseholdUser()
  if (!user.ok) return { error: ACCESS_MESSAGE, added: previous.added }
  await addRestockItem(await restockRepository(), {
    householdId: user.value.householdId,
    label: parsed.data.label,
  })
  refresh()
  return { error: null, added: previous.added + 1 }
}
