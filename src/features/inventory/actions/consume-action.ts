'use server'
// „Verbraucht“ und „−1“ (#46, #125): prüft Eingabe und Haushalt selbst, weil eine Action per POST
// direkt aufrufbar ist (CODE_PRINZIPIEN §7), und lädt danach die Seite neu. Rückgängig statt
// Rückfrage: Die Oberfläche zeigt nach Erfolg die UndoBar mit `undoTakeOutAction`.
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { stockServices } from '../application/stock-services'
import { takeOne, type TakeOneError, type TakenUnit } from '../application/take-one'
import { takeOutUnit, type TakeOutError } from '../application/take-out-unit'
import { type ConsumeRequest, consumeRequestSchema } from '../schemas/requests'
import type { Result } from '@/shared/lib/result'
import {
  ACCESS_MESSAGE,
  GONE_RELOADED,
  takeOutMessage,
  type ActionFailure,
} from './action-messages'

export type ConsumeActionResult = Readonly<{ ok: true; taken: TakenUnit }> | ActionFailure

function messageFor(error: TakeOutError | TakeOneError): string {
  return error.kind === 'empty' ? 'Davon ist nichts mehr im Vorrat.' : takeOutMessage(error)
}

async function run(
  request: ConsumeRequest,
  { householdId, userId }: Readonly<{ householdId: string; userId: string }>,
): Promise<Result<TakenUnit, TakeOutError | TakeOneError>> {
  const { reader, writer, now } = await stockServices()
  if (request.kind === 'target') {
    return takeOne({ reader, writer }, { householdId, userId, target: request.target, now })
  }
  const { unitId } = request
  const result = await takeOutUnit(writer, {
    householdId,
    userId,
    unitId,
    outcome: 'consumed',
    now,
  })
  return result.ok ? { ok: true, value: { unitId, bestBefore: null } } : result
}

export async function consumeAction(input: unknown): Promise<ConsumeActionResult> {
  const parsed = consumeRequestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: GONE_RELOADED }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const result = await run(parsed.data, {
    householdId: user.value.householdId,
    userId: user.value.id,
  })
  refresh()
  return result.ok
    ? { ok: true, taken: result.value }
    : { ok: false, message: messageFor(result.error) }
}
