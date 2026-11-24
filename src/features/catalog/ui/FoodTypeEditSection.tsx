import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { hideFoodTypeAction } from '../actions/hide-food-type-action'
import { removeFoodTypeAction } from '../actions/remove-food-type-action'
import { canRemoveFoodType, type FoodTypeEntry } from '../domain/category'
import { foodTypeFormValues } from './food-type-form-values'
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

const CATEGORY_HIDDEN_HINT =
  'Ihre Kategorie ist ausgeblendet, deshalb steht sie beim Erfassen und für die Foto-Erkennung trotzdem nicht zur Wahl.'

function visibilityHint(foodType: FoodTypeEntry): string {
  if (foodType.isRetired) return 'Diese Art ist nicht mehr in der Startliste.'
  if (foodType.isCategoryHidden && !foodType.isHidden) return CATEGORY_HIDDEN_HINT
  return HIDE_HINT
}

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
            initialValues={foodTypeFormValues(foodType)}
          />
        </div>
      )}
      <GroupHeader id="art-sichtbarkeit">
        {foodType.isHidden ? 'Ausgeblendet' : 'Sichtbar'}
      </GroupHeader>
      {foodType.isRetired ? null : (
        <HideToggleForm id={foodType.id} isHidden={foodType.isHidden} action={hideFoodTypeAction} />
      )}
      <GroupFooter>{visibilityHint(foodType)}</GroupFooter>
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
