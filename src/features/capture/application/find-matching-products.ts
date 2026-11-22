// Wiedererkennen (UX §1, F2): vorhandene Produkte mit gleicher Lebensmittelart, Menge und
// Behälter. Die Oberfläche fragt dann „Zu Spaghetti 500 g hinzufügen?“ und speichert mit
// `{ kind: 'existing', productId }`. Es bleibt ein Vorschlag, nichts wird zusammengelegt.
import 'server-only'
import { isSameProduct, type ProductIdentity } from '../domain/product-match'
import type { ProductMatchQuery } from '../schemas'
import type { StockWriter } from './stock-writer'

export interface ProductMatch {
  id: string
  name: string
  content: ProductIdentity['content']
  containerName: string | null
  storageLocationName: string | null
}

interface FindMatchingProductsRequest {
  householdId: string
  query: ProductMatchQuery
}

export async function findMatchingProducts(
  writer: Pick<StockWriter, 'findProductsByFoodType'>,
  { householdId, query }: FindMatchingProductsRequest,
): Promise<ProductMatch[]> {
  const candidates = await writer.findProductsByFoodType(householdId, query.foodTypeId)
  return candidates
    .filter((candidate) => isSameProduct(candidate, query))
    .map(({ id, name, content, containerName, storageLocationName }) => ({
      id,
      name,
      content,
      containerName,
      storageLocationName,
    }))
}
