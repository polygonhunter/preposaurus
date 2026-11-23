import { notFound } from 'next/navigation'
import { loadDetail } from '@/features/inventory/application/load-detail'
import { loadStockTree } from '@/features/inventory/application/load-stock-tree'
import { StockDetailSplit } from '@/features/inventory/ui/StockDetailSplit'
import { requirePageHousehold } from '@/server/auth/household'

// Detail einer Lebensmittelart (UX-Konzept §8.4, #45), ab „mittel“ mit der Liste daneben (M12-03).
export default async function FoodTypeDetailPage({ params }: PageProps<'/vorrat/art/[id]'>) {
  const { householdId, isAdmin } = await requirePageHousehold()
  const { id } = await params
  const [result, tree] = await Promise.all([
    loadDetail(householdId, { kind: 'food-type', id }),
    loadStockTree(householdId),
  ])
  if (!result.ok) notFound()
  return <StockDetailSplit {...result.value} tree={tree} isAdmin={isAdmin} />
}
