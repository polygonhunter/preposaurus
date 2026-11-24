'use server'
// „Datum ändern“ bzw. „Datum nachtragen“ speichern (#49, #116). Das Formular liegt beim Erfassen,
// weil es dieselbe Datumseingabe nutzt. Gespeichert wird im Vorrat: Ändert sich der Tag, gilt
// „Noch gut“ nicht mehr (#135). Admin und Mitglied dürfen das.
import { z } from 'zod'
import { changeUnitDates } from '@/features/inventory/application/change-unit-dates'
import { unitDateEditor } from '@/features/inventory/application/edit-services'
import { changeUnitDatesSchema } from '@/features/inventory/schemas/requests'
import { requireHouseholdUser } from '@/server/auth/guards'
import { toCalendarDay } from '@/shared/lib/dates'
import { failure, SESSION_MESSAGE, type EditActionState } from './edit-messages'

const GONE = 'Diese Packungen sind nicht mehr im Vorrat. Bitte geht zurück zum Vorrat.'

export async function changeUnitDatesAction(input: unknown): Promise<EditActionState> {
  const user = await requireHouseholdUser()
  if (!user.ok) return failure(SESSION_MESSAGE)
  const parsed = changeUnitDatesSchema.safeParse(input)
  if (!parsed.success) {
    return failure('Bitte prüft das Datum.', z.flattenError(parsed.error).fieldErrors)
  }
  const { unitIds, bestBefore, kind } = parsed.data
  const result = await changeUnitDates(await unitDateEditor(), {
    householdId: user.value.householdId,
    unitIds,
    bestBefore: { date: toCalendarDay(bestBefore.date), precision: bestBefore.precision },
    kind,
  })
  return result.ok ? { status: 'saved' } : failure(GONE)
}
