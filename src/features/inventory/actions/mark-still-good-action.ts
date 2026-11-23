'use server'
// „Noch gut“ (#47, ROT-05): setzt `geprueft_am` der Packungen eines Eintrags bzw. einer
// Datumszeile. Die Packungen bleiben im Vorrat. Rückgängig statt Rückfrage (UX-Konzept P7): Die
// Oberfläche zeigt nach Erfolg die UndoBar mit `undoStillGoodAction`.
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { markStillGood, type StillGoodError } from '../application/mark-still-good'
import { stockServices } from '../application/stock-services'
import { stillGoodRequestSchema } from '../schemas'
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
