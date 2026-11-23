// Detailseite aus der Adresse (#45): Art und ID kommen ungeprüft aus der URL. Eine kaputte ID
// ergibt wie eine fremde oder unbekannte „nicht gefunden“ (DATENKATALOG §8 Nr. 3). Dazu der
// Verlauf der Lebensmittelart (#48) und die Quelle des Tagesbedarfs (#230).
import 'server-only'
import { loadActiveSource } from '@/features/supply/application/load-active-source'
import type { RecommendationSource } from '@/shared/config/recommendation-source'
import { err, ok, type Result } from '@/shared/lib/result'
import { stockTargetSchema, type FoodTypeDetail, type HistoryEntry } from '../schemas'
import { getFoodTypeDetail } from './get-food-type-detail'
import { getFoodTypeHistory } from './get-food-type-history'
import type { NotFound } from './read-context'
import { stockServices } from './stock-services'

export interface DetailPage {
  detail: FoodTypeDetail
  history: HistoryEntry[]
  /** Quelle des Tagesbedarfs für das Erklär-Blatt der Kennwerte (#230) */
  source: RecommendationSource | null
}

export async function loadDetail(
  householdId: string,
  target: Readonly<{ kind: string; id: string }>,
): Promise<Result<DetailPage, NotFound>> {
  const parsed = stockTargetSchema.safeParse(target)
  if (!parsed.success) return err({ kind: 'not-found' })
  const { reader, history, today } = await stockServices()
  const input = { householdId, target: parsed.data }
  const [detail, entries, source] = await Promise.all([
    getFoodTypeDetail(reader, { ...input, today }),
    getFoodTypeHistory({ reader, history }, input),
    loadActiveSource(householdId),
  ])
  return detail.ok ? ok({ detail: detail.value, history: entries, source }) : detail
}
