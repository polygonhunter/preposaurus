'use server'
// Lücke bis zum Ziel abhaken oder ausblenden (#201, UX-Konzept §8.6). Prüft Eingabe und Haushalt
// selbst, weil eine Action per POST direkt aufrufbar ist (CODE_PRINZIPIEN §7). „Rückgängig“ und
// „Wieder zeigen“ entfernen den Eintrag über removeRestockItemAction.
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { changeGapStatus } from '../application/restock-services'
import { gapStatusSchema } from '../schemas'
import { ACCESS_MESSAGE, type RestockActionResult } from './restock-messages'

type SetGapStatusResult = RestockActionResult<{ entryId: string }>

const CLOSED = 'Diese Lücke ist inzwischen geschlossen. Die Liste ist jetzt neu geladen.'

export async function setGapStatusAction(input: unknown): Promise<SetGapStatusResult> {
  const parsed = gapStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: CLOSED }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const result = await changeGapStatus(user.value.householdId, parsed.data)
  refresh()
  return result.ok ? { ok: true, entryId: result.value.entryId } : { ok: false, message: CLOSED }
}
