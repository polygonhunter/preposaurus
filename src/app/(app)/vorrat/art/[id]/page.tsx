import { notFound } from 'next/navigation'
import { loadDetail } from '@/features/inventory/application/load-detail'
import { FoodTypeDetailView } from '@/features/inventory/ui/FoodTypeDetailView'
import { requirePageHousehold } from '@/server/auth/household'

// Detail einer Lebensmittelart (UX-Konzept §8.4, #45).
export default async function FoodTypeDetailPage({ params }: PageProps<'/vorrat/art/[id]'>) {
  const { householdId } = await requirePageHousehold()
  const { id } = await params
  const result = await loadDetail(householdId, { kind: 'food-type', id })
  if (!result.ok) notFound()
  return <FoodTypeDetailView {...result.value} />
}
