'use server'
// „Auf die Nachkaufen-Liste“ in der Rückgängig-Zeile nach „−1“ oder „Verbraucht“ (#74, UX D15):
// ein Tipp, kein Dialog. Die Action liegt beim Vorrat, weil dessen Oberfläche sie aufruft; die
// Logik steckt im Use-Case der Nachkaufen-Liste.
import { addConsumedUnit } from '@/features/restock/application/add-consumed-unit'
import { restockRepository } from '@/features/restock/application/restock-services'
import { requireHouseholdUser } from '@/server/auth/guards'
import { unitIdSchema } from '../schemas'
import { ACCESS_MESSAGE, type ActionFailure } from './action-messages'

export type AddToRestockResult = Readonly<{ ok: true; message: string }> | ActionFailure

const GONE = 'Diese Packung gibt es nicht mehr.'

export async function addToRestockAction(unitId: unknown): Promise<AddToRestockResult> {
  const parsed = unitIdSchema.safeParse(unitId)
  if (!parsed.success) return { ok: false, message: GONE }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const result = await addConsumedUnit(await restockRepository(), {
    householdId: user.value.householdId,
    unitId: parsed.data,
  })
  if (!result.ok) return { ok: false, message: GONE }
  const { label, wasListed } = result.value
  return {
    ok: true,
    message: wasListed
      ? `${label} steht schon auf der Nachkaufen-Liste.`
      : `${label} steht jetzt auf der Nachkaufen-Liste.`,
  }
}
