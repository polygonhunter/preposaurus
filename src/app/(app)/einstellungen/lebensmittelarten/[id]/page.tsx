import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { getCategoryOverview } from '@/features/catalog/application/categories'
import { findFoodType } from '@/features/catalog/application/food-types'
import { catalogIdSchema } from '@/features/catalog/schemas'
import { categoryChoices, foodTypeSummary } from '@/features/catalog/ui/catalog-labels'
import { FoodTypeEditSection } from '@/features/catalog/ui/FoodTypeEditSection'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { categoryPath } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Lebensmittelart · Preposaurus' }

// Eine Lebensmittelart bearbeiten (#126), nur für den Admin. Eine fremde eigene Art findet nichts,
// weil das Repository auf den Haushalt filtert.
export default async function FoodTypePage({
  params,
}: PageProps<'/einstellungen/lebensmittelarten/[id]'>) {
  const { householdId } = await requirePageHouseholdAdmin()
  const parsed = catalogIdSchema.safeParse((await params).id)
  if (!parsed.success) notFound()
  const services = await catalogServices()
  const [foodType, { categories }] = await Promise.all([
    findFoodType(services, { householdId, id: parsed.data }),
    getCategoryOverview(services, householdId),
  ])
  if (foodType === null) notFound()
  return (
    <>
      <PageHeader
        title={foodType.name}
        subtitle={`${foodType.productGroupName} › ${foodType.categoryName} · ${foodTypeSummary(foodType)}`}
        back={{ href: categoryPath(foodType.categoryId), label: foodType.categoryName }}
      />
      <FoodTypeEditSection
        foodType={foodType}
        categories={categoryChoices(categories, foodType.categoryId)}
      />
    </>
  )
}
