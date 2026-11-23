import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { getCategoryOverview } from '@/features/catalog/application/categories'
import { listFoodTypes } from '@/features/catalog/application/food-types'
import { catalogIdSchema } from '@/features/catalog/schemas'
import { categorySummary } from '@/features/catalog/ui/catalog-labels'
import { CategoryEditSection } from '@/features/catalog/ui/CategoryEditSection'
import { FoodTypeList } from '@/features/catalog/ui/FoodTypeList'
import { requirePageHousehold } from '@/server/auth/household'
import { CATEGORIES_PATH, newFoodTypeInCategoryPath } from '@/shared/config/settings-paths'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { EmptyState } from '@/shared/ui/EmptyState'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Kategorie · Preposaurus' }

// Eine Kategorie mit ihren Lebensmittelarten (#76, #126). Alle im Haushalt sehen sie, der Admin
// ändert. Eine fremde eigene Kategorie findet nichts, weil das Repository auf den Haushalt filtert.
export default async function CategoryPage({
  params,
}: PageProps<'/einstellungen/kategorien/[id]'>) {
  const { householdId, isAdmin } = await requirePageHousehold()
  const parsed = catalogIdSchema.safeParse((await params).id)
  if (!parsed.success) notFound()
  const services = await catalogServices()
  const [{ groups, categories }, foodTypes] = await Promise.all([
    getCategoryOverview(services, householdId),
    listFoodTypes(services, householdId),
  ])
  const category = categories.find((entry) => entry.id === parsed.data)
  if (category === undefined) notFound()
  const inCategory = foodTypes.filter((foodType) => foodType.categoryId === category.id)
  return (
    <>
      <PageHeader
        title={category.name}
        subtitle={`${category.productGroupName} · ${categorySummary(category)}`}
        back={{ href: CATEGORIES_PATH, label: 'Kategorien' }}
      />
      {isAdmin ? <CategoryEditSection category={category} groups={groups} /> : null}
      <GroupHeader id="arten">Lebensmittelarten</GroupHeader>
      {inCategory.length === 0 ? (
        <EmptyState text="In dieser Kategorie gibt es noch keine Lebensmittelart." />
      ) : (
        <FoodTypeList foodTypes={inCategory} labelledBy="arten" canEdit={isAdmin} />
      )}
      {isAdmin && !category.isHidden ? (
        <div className="mx-4 flex pt-4 breit:mx-6">
          <ButtonLink href={newFoodTypeInCategoryPath(category.id)} variant="tinted">
            Neue Lebensmittelart
          </ButtonLink>
        </div>
      ) : null}
    </>
  )
}
