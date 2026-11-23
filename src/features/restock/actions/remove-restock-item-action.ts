'use server'
// Eintrag entfernen (#73). Ein Eintrag der Liste ist keine Historie, er wird wirklich gelöscht.
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { removeRestockItem } from '../application/change-restock-items'
import { restockRepository } from '../application/restock-services'
import { restockItemIdSchema } from '../schemas'
import { ACCESS_MESSAGE, GONE_MESSAGE, type RestockActionResult } from './restock-messages'

export async function removeRestockItemAction(id: unknown): Promise<RestockActionResult> {
  const parsed = restockItemIdSchema.safeParse(id)
  if (!parsed.success) return { ok: false, message: GONE_MESSAGE }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const result = await removeRestockItem(await restockRepository(), {
    householdId: user.value.householdId,
    id: parsed.data,
  })
  refresh()
  return result.ok ? { ok: true } : { ok: false, message: GONE_MESSAGE }
}
