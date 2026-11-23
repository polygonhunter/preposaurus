import type { Metadata } from 'next'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { getCategoryOverview } from '@/features/catalog/application/categories'
import { CategoryForm } from '@/features/catalog/ui/CategoryForm'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { CATEGORIES_PATH } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Neue Kategorie · Preposaurus' }

// Eigene Kategorie anlegen (#76), nur für den Admin.
export default async function NewCategoryPage() {
  const { householdId } = await requirePageHouseholdAdmin()
  const { groups } = await getCategoryOverview(await catalogServices(), householdId)
  return (
    <>
      <PageHeader title="Neue Kategorie" back={{ href: CATEGORIES_PATH, label: 'Kategorien' }} />
      <div className="pt-6">
        <CategoryForm groups={groups} />
      </div>
    </>
  )
}
