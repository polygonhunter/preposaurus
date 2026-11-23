'use server'
// „Entsorgt“ (#47, ROT-04) für eine bestimmte Packung: aus dem Blatt einer Datumszeile und aus
// „Bald fällig“. Setzt Status, Zeitpunkt und Nutzer. Rückgängig statt Rückfrage (UX-Konzept P7):
// Die Oberfläche zeigt nach Erfolg die UndoBar mit `undoTakeOutAction`.
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { stockServices } from '../application/stock-services'
import { takeOutUnit } from '../application/take-out-unit'
import { unitIdSchema } from '../schemas'
import {
  ACCESS_MESSAGE,
  GONE_RELOADED,
  takeOutMessage,
  type ActionFailure,
} from './action-messages'

export type DiscardActionResult = Readonly<{ ok: true; unitId: string }> | ActionFailure

export async function discardAction(unitId: unknown): Promise<DiscardActionResult> {
  const parsed = unitIdSchema.safeParse(unitId)
  if (!parsed.success) return { ok: false, message: GONE_RELOADED }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const { writer, now } = await stockServices()
  const result = await takeOutUnit(writer, {
    householdId: user.value.householdId,
    userId: user.value.id,
    unitId: parsed.data,
    outcome: 'discarded',
    now,
  })
  refresh()
  return result.ok
    ? { ok: true, unitId: parsed.data }
    : { ok: false, message: takeOutMessage(result.error) }
}
