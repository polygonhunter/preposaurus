'use server'
// „Rückgängig“ in der UndoBar nach „Noch gut“ (#47, UX-Konzept §7, P7): löscht `geprueft_am` nur
// bei den eben geprüften Packungen und nur, solange dort noch derselbe Tag steht.
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { undoStillGood } from '../application/mark-still-good'
import { stockServices } from '../application/stock-services'
import { undoStillGoodSchema } from '../schemas/requests'
import { toCalendarDay } from '@/shared/lib/dates'

/** Ist „Noch gut“ schon weg, ist nichts zu tun. */
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
