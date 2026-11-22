'use server'
// „Rückgängig“ in der UndoBar nach Verbraucht (#46, UX-Konzept §7, P7).
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { returnToStock } from '../application/return-to-stock'
import { stockServices } from '../application/stock-services'
import { unitIdSchema } from '../schemas'
import { ACCESS_MESSAGE, type ActionFailure } from './action-messages'

export type UndoActionResult = Readonly<{ ok: true }> | ActionFailure

const GONE = 'Diese Packung gibt es nicht mehr.'

export async function undoConsumeAction(unitId: unknown): Promise<UndoActionResult> {
  const parsed = unitIdSchema.safeParse(unitId)
  if (!parsed.success) return { ok: false, message: GONE }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const { writer } = await stockServices()
  const result = await returnToStock(writer, {
    householdId: user.value.householdId,
    unitId: parsed.data,
  })
  refresh()
  return result.ok ? { ok: true } : { ok: false, message: GONE }
}
