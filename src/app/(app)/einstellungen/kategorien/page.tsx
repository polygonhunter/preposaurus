import type { Metadata } from 'next'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { getCategoryOverview } from '@/features/catalog/application/categories'
import { CategoryList } from '@/features/catalog/ui/CategoryList'
import { requirePageHousehold } from '@/server/auth/household'
import { FOOD_TYPES_PATH, NEW_CATEGORY_PATH, SETTINGS_PATH } from '@/shared/config/settings-paths'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Kategorien · Preposaurus' }

// Kategorien je Warengruppe (#76) und der Weg zu den Lebensmittelarten (#126). Der Admin legt eigene
// Kategorien an und blendet aus, Mitglieder sehen alles nur lesend.
export default async function CategoriesPage() {
  const { householdId, isAdmin } = await requirePageHousehold()
  const { groups, categories } = await getCategoryOverview(await catalogServices(), householdId)
  return (
    <>
      <PageHeader
        title="Kategorien"
        back={{ href: SETTINGS_PATH, label: 'Einstellungen' }}
        action={
          isAdmin ? (
            <ButtonLink href={NEW_CATEGORY_PATH} variant="plain">
              Neue Kategorie
            </ButtonLink>
          ) : undefined
        }
      />
      <div className="pt-4">
        <Group>
          <Row title="Lebensmittelart suchen" action={{ href: FOOD_TYPES_PATH }} />
        </Group>
      </div>
      <GroupFooter>
        Jede Lebensmittelart gehört zu einer Kategorie, jede Kategorie zu einer Warengruppe. Die
        Warengruppe bestimmt, wofür ein Produkt im Vorrat zählt. Kategorien der Startliste lassen
        sich ausblenden, eigene auch ändern.{isAdmin ? null : ' Das ändert ein Admin.'}
      </GroupFooter>
      <CategoryList groups={groups} categories={categories} />
    </>
  )
}
