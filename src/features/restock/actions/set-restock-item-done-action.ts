'use server'
// Abhaken und wieder öffnen (#73, NK-04). Auch „Rückgängig“ nach dem Abhaken läuft hierüber.
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { setRestockItemDone } from '../application/change-restock-items'
import { restockRepository } from '../application/restock-services'
import { restockItemDoneSchema } from '../schemas'
import { ACCESS_MESSAGE, GONE_MESSAGE, type RestockActionResult } from './restock-messages'

export async function setRestockItemDoneAction(input: unknown): Promise<RestockActionResult> {
  const parsed = restockItemDoneSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: GONE_MESSAGE }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const result = await setRestockItemDone(await restockRepository(), {
    householdId: user.value.householdId,
    ...parsed.data,
  })
  refresh()
  return result.ok ? { ok: true } : { ok: false, message: GONE_MESSAGE }
}
