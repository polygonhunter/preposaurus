'use server'
// „Nachkaufen“ in der Rückgängig-Zeile nach „−1“ oder „Verbraucht“ (#74, UX D15): ein Tipp, kein
// Dialog. „Rückgängig“ nimmt einen so angelegten Eintrag wieder von der Liste (DATENKATALOG §5).
// Die Actions liegen beim Vorrat, weil dessen Oberfläche sie aufruft und Features untereinander
// nur `application/` nutzen dürfen; die Logik steckt in den Use-Cases der Nachkaufen-Liste.
import { addConsumedUnit } from '@/features/restock/application/add-consumed-unit'
import { removeRestockItem } from '@/features/restock/application/change-restock-items'
import { restockRepository } from '@/features/restock/application/restock-services'
import { restockItemIdSchema } from '@/features/restock/schemas'
import { requireHouseholdUser } from '@/server/auth/guards'
import { unitIdSchema } from '../schemas'
import { ACCESS_MESSAGE, type ActionFailure } from './action-messages'

export type AddToRestockResult =
  Readonly<{ ok: true; message: string; addedItemId: string | null }> | ActionFailure

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
  const { label, addedItemId } = result.value
  const message =
    addedItemId === null
      ? `${label} steht schon auf der Nachkaufen-Liste.`
      : `${label} steht jetzt auf der Nachkaufen-Liste.`
  return { ok: true, message, addedItemId }
}

/** Nimmt den eben angelegten Eintrag zurück; ist er schon weg, ist nichts zu tun. */
export async function takeBackFromRestockAction(itemId: unknown): Promise<void> {
  const parsed = restockItemIdSchema.safeParse(itemId)
  if (!parsed.success) return
  const user = await requireHouseholdUser()
  if (!user.ok) return
  await removeRestockItem(await restockRepository(), {
    householdId: user.value.householdId,
    id: parsed.data,
  })
}
