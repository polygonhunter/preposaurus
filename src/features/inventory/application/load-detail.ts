// Detailseite aus der Adresse (#45): Art und ID kommen ungeprüft aus der URL. Eine kaputte ID
// ergibt wie eine fremde oder unbekannte „nicht gefunden“ (DATENKATALOG §8 Nr. 3).
import 'server-only'
import { err, type Result } from '@/shared/lib/result'
import { stockTargetSchema, type FoodTypeDetail } from '../schemas'
import { getFoodTypeDetail } from './get-food-type-detail'
import type { NotFound } from './read-context'
import { stockServices } from './stock-services'

export async function loadDetail(
  householdId: string,
  target: Readonly<{ kind: string; id: string }>,
): Promise<Result<FoodTypeDetail, NotFound>> {
  const parsed = stockTargetSchema.safeParse(target)
  if (!parsed.success) return err({ kind: 'not-found' })
  const { reader, today } = await stockServices()
  return getFoodTypeDetail(reader, { householdId, today, target: parsed.data })
}
