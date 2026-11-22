import { notFound } from 'next/navigation'
import { loadDetail } from '@/features/inventory/application/load-detail'
import { FoodTypeDetailView } from '@/features/inventory/ui/FoodTypeDetailView'
import { requirePageHousehold } from '@/server/auth/household'

// Detail eines Produkts ohne Lebensmittelart: gleiche Seite wie die Art (#43, #45).
export default async function ProductDetailPage({ params }: PageProps<'/vorrat/produkt/[id]'>) {
  const { householdId } = await requirePageHousehold()
  const { id } = await params
  const result = await loadDetail(householdId, { kind: 'product', id })
  if (!result.ok) notFound()
  return <FoodTypeDetailView detail={result.value} />
}
