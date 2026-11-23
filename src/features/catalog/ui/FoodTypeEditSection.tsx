import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { hideFoodTypeAction } from '../actions/hide-food-type-action'
import { removeFoodTypeAction } from '../actions/remove-food-type-action'
import { canRemoveFoodType, type FoodTypeEntry } from '../domain/category'
import { FoodTypeForm } from './FoodTypeForm'
import { HideToggleForm } from './HideToggleForm'
import { RemoveEntryButton } from './RemoveEntryButton'
import type { CategoryChoice } from './CategoryPicker'
import { SystemFoodTypeFacts } from './SystemFoodTypeFacts'

type FoodTypeEditSectionProps = Readonly<{
  foodType: FoodTypeEntry
  categories: readonly CategoryChoice[]
}>

const HIDE_HINT =
  'Ausgeblendet erscheint sie beim Erfassen nicht mehr in der Suche und nicht in der Foto-Erkennung. Produkte darauf bleiben sichtbar und zählen weiter.'

// Was der Admin an einer Lebensmittelart ändern kann (#126): eigene vollständig, jede je Haushalt
// ausblenden, eigene ohne Produkte löschen.
export function FoodTypeEditSection({ foodType, categories }: FoodTypeEditSectionProps) {
  return (
    <>
      {foodType.isSystem ? (
        <SystemFoodTypeFacts foodType={foodType} />
      ) : (
        <div className="pt-6">
          <FoodTypeForm
            foodTypeId={foodType.id}
            categories={categories}
            initialValues={{
              name: foodType.name,
              categoryId: foodType.categoryId,
              searchTerms: foodType.searchTerms.join(', '),
              kcalPer100: foodType.kcalPer100 === null ? '' : String(foodType.kcalPer100),
            }}
          />
        </div>
      )}
      <GroupHeader id="art-sichtbarkeit">
        {foodType.isHidden ? 'Ausgeblendet' : 'Sichtbar'}
      </GroupHeader>
      {foodType.isRetired ? null : (
        <HideToggleForm id={foodType.id} isHidden={foodType.isHidden} action={hideFoodTypeAction} />
      )}
      <GroupFooter>
        {foodType.isRetired ? 'Diese Art ist nicht mehr in der Startliste.' : HIDE_HINT}
      </GroupFooter>
      {canRemoveFoodType(foodType) ? (
        <div className="pt-6">
          <RemoveEntryButton
            id={foodType.id}
            name={foodType.name}
            action={removeFoodTypeAction}
            label="Lebensmittelart löschen"
          />
        </div>
      ) : null}
    </>
  )
}
