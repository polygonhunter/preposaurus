'use server'
// „Noch gut“ und sein Rückgängig (#47, ROT-05): setzt bzw. löscht `geprueft_am` der Packungen
// eines Eintrags. Die Packungen bleiben im Vorrat. Rückgängig statt Rückfrage (UX-Konzept P7).
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { markStillGood, undoStillGood, type StillGoodError } from '../application/mark-still-good'
import { stockServices } from '../application/stock-services'
import { stillGoodRequestSchema, undoStillGoodSchema } from '../schemas'
import { toCalendarDay } from '@/shared/lib/dates'
import { ACCESS_MESSAGE, GONE_RELOADED, type ActionFailure } from './action-messages'

export type StillGoodActionResult =
  Readonly<{ ok: true; unitIds: string[]; checkedAt: string }> | ActionFailure

function messageFor(error: StillGoodError): string {
  switch (error.kind) {
    case 'not-found':
      return GONE_RELOADED
    case 'not-applicable':
      return '„Noch gut“ gibt es nur für abgelaufene Packungen mit MHD, die noch niemand geprüft hat.'
  }
}

export async function markStillGoodAction(unitIds: unknown): Promise<StillGoodActionResult> {
  const parsed = stillGoodRequestSchema.safeParse(unitIds)
  if (!parsed.success) return { ok: false, message: GONE_RELOADED }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const { writer, today } = await stockServices()
  const result = await markStillGood(writer, {
    householdId: user.value.householdId,
    unitIds: parsed.data,
    today,
  })
  refresh()
  return result.ok
    ? { ok: true, ...result.value }
    : { ok: false, message: messageFor(result.error) }
}

/** Nimmt „Noch gut“ für die eben geprüften Packungen zurück; ist es schon weg, ist nichts zu tun. */
export async function undoStillGoodAction(input: unknown): Promise<void> {
  const parsed = undoStillGoodSchema.safeParse(input)
  if (!parsed.success) return
  const user = await requireHouseholdUser()
  if (!user.ok) return
  const { writer } = await stockServices()
  await undoStillGood(writer, {
    householdId: user.value.householdId,
    unitIds: parsed.data.unitIds,
    checkedAt: toCalendarDay(parsed.data.checkedAt),
  })
  refresh()
}
