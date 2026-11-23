import type { Metadata } from 'next'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { listFoodTypes } from '@/features/catalog/application/food-types'
import { filterFoodTypes } from '@/features/catalog/domain/catalog-search'
import { FoodTypeList } from '@/features/catalog/ui/FoodTypeList'
import { FoodTypeSearchForm } from '@/features/catalog/ui/FoodTypeSearchForm'
import { requirePageHousehold } from '@/server/auth/household'
import { CATEGORIES_PATH, NEW_FOOD_TYPE_PATH } from '@/shared/config/settings-paths'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { EmptyState } from '@/shared/ui/EmptyState'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Lebensmittelarten · Preposaurus' }

const MAX_HITS = 50
const MAX_QUERY_LENGTH = 100

// Lebensmittelarten suchen (#126): über 300 Arten, deshalb Suche statt langer Liste. Ohne Suche
// stehen die eigenen und die ausgeblendeten Arten da. Der Admin öffnet eine Art zum Ändern.
export default async function FoodTypesPage({
  searchParams,
}: PageProps<'/einstellungen/lebensmittelarten'>) {
  const { householdId, isAdmin } = await requirePageHousehold()
  const raw = (await searchParams)['suche']
  const query = typeof raw === 'string' ? raw.slice(0, MAX_QUERY_LENGTH) : ''
  const foodTypes = await listFoodTypes(await catalogServices(), householdId)
  const hits = filterFoodTypes(foodTypes, query)
  const own = foodTypes.filter((foodType) => !foodType.isSystem)
  const hidden = foodTypes.filter((foodType) => foodType.isHidden)
  return (
    <>
      <PageHeader
        title="Lebensmittelarten"
        back={{ href: CATEGORIES_PATH, label: 'Kategorien' }}
        action={
          isAdmin ? (
            <ButtonLink href={NEW_FOOD_TYPE_PATH} variant="plain">
              Neue Art
            </ButtonLink>
          ) : undefined
        }
      />
      <FoodTypeSearchForm query={query} />
      {query.trim() === '' ? null : (
        <>
          <GroupHeader id="treffer">Treffer</GroupHeader>
          {hits.length === 0 ? (
            <EmptyState text="Keine Lebensmittelart gefunden." />
          ) : (
            <FoodTypeList
              foodTypes={hits.slice(0, MAX_HITS)}
              labelledBy="treffer"
              canEdit={isAdmin}
              showPath
            />
          )}
        </>
      )}
      <GroupHeader id="eigene">Eigene Lebensmittelarten</GroupHeader>
      {own.length === 0 ? (
        <EmptyState text="Noch keine eigenen Arten. Die Startliste deckt das übliche Sortiment ab." />
      ) : (
        <FoodTypeList foodTypes={own} labelledBy="eigene" canEdit={isAdmin} showPath />
      )}
      {hidden.length > 0 ? (
        <>
          <GroupHeader id="ausgeblendet">Ausgeblendet</GroupHeader>
          <FoodTypeList foodTypes={hidden} labelledBy="ausgeblendet" canEdit={isAdmin} showPath />
          <GroupFooter>
            Stehen beim Erfassen und für die Foto-Erkennung nicht zur Wahl. Produkte darauf bleiben
            sichtbar und zählen weiter.{isAdmin ? null : ' Das ändert ein Admin.'}
          </GroupFooter>
        </>
      ) : null}
    </>
  )
}
