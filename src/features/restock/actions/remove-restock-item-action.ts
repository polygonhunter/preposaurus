'use server'
// Eintrag entfernen (#73) und „Rückgängig“ danach (#202, UX-Konzept §7). Ein Eintrag der Liste ist
// keine Historie, er wird wirklich gelöscht; die Action gibt ihn zurück, damit „Rückgängig“ ihn
// fünf Sekunden lang wieder anlegen kann.
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { removeRestockItem, restoreRestockItem } from '../application/change-restock-items'
import { restockRepository } from '../application/restock-services'
import { removedRestockItemSchema, restockItemIdSchema, type RemovedRestockItem } from '../schemas'
import { ACCESS_MESSAGE, GONE_MESSAGE, type RestockActionResult } from './restock-messages'

type RemoveRestockItemResult = RestockActionResult<{ removed: RemovedRestockItem }>

export async function removeRestockItemAction(id: unknown): Promise<RemoveRestockItemResult> {
  const parsed = restockItemIdSchema.safeParse(id)
  if (!parsed.success) return { ok: false, message: GONE_MESSAGE }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const result = await removeRestockItem(await restockRepository(), {
    householdId: user.value.householdId,
    id: parsed.data,
  })
  refresh()
  if (!result.ok) return { ok: false, message: GONE_MESSAGE }
  const { createdAt, doneAt, ...item } = result.value
  return {
    ok: true,
    removed: { ...item, createdAt: createdAt.toISOString(), doneAt: doneAt?.toISOString() ?? null },
  }
}

export async function restoreRestockItemAction(input: unknown): Promise<RestockActionResult> {
  const parsed = removedRestockItemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: GONE_MESSAGE }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const { createdAt, doneAt, ...item } = parsed.data
  await restoreRestockItem(await restockRepository(), {
    householdId: user.value.householdId,
    item: {
      ...item,
      createdAt: new Date(createdAt),
      doneAt: doneAt === null ? null : new Date(doneAt),
    },
  })
  refresh()
  return { ok: true }
}
