import type { Metadata } from 'next'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { getCategoryOverview } from '@/features/catalog/application/categories'
import { catalogIdSchema } from '@/features/catalog/schemas'
import { categoryChoices } from '@/features/catalog/ui/catalog-labels'
import { emptyFoodTypeFormValues } from '@/features/catalog/ui/food-type-form-values'
import { FoodTypeForm } from '@/features/catalog/ui/FoodTypeForm'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { FOOD_TYPES_PATH } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Neue Lebensmittelart · Preposaurus' }

// Eigene Lebensmittelart anlegen (#126), nur für den Admin. Aus einer Kategorie heraus ist sie
// schon gewählt (?kategorie=…).
export default async function NewFoodTypePage({
  searchParams,
}: PageProps<'/einstellungen/lebensmittelarten/neu'>) {
  const { householdId } = await requirePageHouseholdAdmin()
  const preset = catalogIdSchema.safeParse((await searchParams)['kategorie'])
  const { categories } = await getCategoryOverview(await catalogServices(), householdId)
  const choices = categoryChoices(categories)
  const categoryId =
    preset.success && choices.some((choice) => choice.id === preset.data) ? preset.data : ''
  return (
    <>
      <PageHeader
        title="Neue Lebensmittelart"
        back={{ href: FOOD_TYPES_PATH, label: 'Lebensmittelarten' }}
      />
      <div className="pt-6">
        <FoodTypeForm categories={choices} initialValues={emptyFoodTypeFormValues(categoryId)} />
      </div>
    </>
  )
}
