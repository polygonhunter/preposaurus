import { notFound } from 'next/navigation'
import { loadDetail } from '@/features/inventory/application/load-detail'
import { loadStockTree } from '@/features/inventory/application/load-stock-tree'
import { StockDetailSplit } from '@/features/inventory/ui/StockDetailSplit'
import { requirePageHousehold } from '@/server/auth/household'

// Detail eines Produkts ohne Lebensmittelart: gleiche Seite wie die Art (#43, #45, M12-03).
export default async function ProductDetailPage({ params }: PageProps<'/vorrat/produkt/[id]'>) {
  const { householdId, isAdmin } = await requirePageHousehold()
  const { id } = await params
  const [result, tree] = await Promise.all([
    loadDetail(householdId, { kind: 'product', id }),
    loadStockTree(householdId),
  ])
  if (!result.ok) notFound()
  return <StockDetailSplit {...result.value} tree={tree} isAdmin={isAdmin} />
}
