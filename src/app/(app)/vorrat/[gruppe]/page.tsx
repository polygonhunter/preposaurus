import { notFound } from 'next/navigation'
import { getFoodTypeLevel } from '@/features/inventory/application/get-food-type-level'
import { stockServices } from '@/features/inventory/application/stock-services'
import { ConsumeProvider } from '@/features/inventory/ui/ConsumeProvider'
import { FoodTypeLevelList } from '@/features/inventory/ui/FoodTypeLevelList'
import { groupSubtitle } from '@/features/inventory/ui/stock-format'
import { STOCK_PATH } from '@/features/inventory/ui/stock-paths'
import { requirePageHousehold } from '@/server/auth/household'
import { PageHeader } from '@/shared/ui/PageHeader'

// Vorrat Ebene 2 (UX-Konzept §8.3, #44): Lebensmittelarten einer Warengruppe nach Kategorie.
export default async function FoodTypeLevelPage({ params }: PageProps<'/vorrat/[gruppe]'>) {
  const { householdId } = await requirePageHousehold()
  const { gruppe } = await params
  const { reader, today } = await stockServices()
  const result = await getFoodTypeLevel(reader, { householdId, today, groupKey: gruppe })
  if (!result.ok) notFound()
  const { group, categories } = result.value
  return (
    <ConsumeProvider>
      <PageHeader
        title={group.name}
        subtitle={groupSubtitle(group.totals)}
        back={{ href: STOCK_PATH, label: 'Vorrat' }}
      />
      <FoodTypeLevelList categories={categories} />
    </ConsumeProvider>
  )
}
