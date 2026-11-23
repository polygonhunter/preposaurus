import { parseContentQuantity, type ContentUnit } from '@/shared/lib/quantities'
import { Field } from '@/shared/ui/Field'
import { Toggle } from '@/shared/ui/Toggle'
import type { CaptureOptions, FoodTypeChoice } from '../domain/capture-options'
import { ChoiceChips } from './ChoiceChips'
import { NutritionFields } from './NutritionFields'
import type { useProductEdit } from './use-product-edit'

type ProductEditFieldsProps = Readonly<{
  edit: ReturnType<typeof useProductEdit>
  options: Pick<CaptureOptions, 'containers' | 'storageLocations'>
  foodType: FoodTypeChoice | null
  // Einheit der gespeicherten Packung, solange der Inhalt im Feld nicht lesbar ist
  savedUnit: ContentUnit
  // Nur bei einer unbestätigten KI-Schätzung (#115)
  canConfirmEstimate: boolean
  nutritionOpen: Readonly<{ isOpen: boolean; onToggle: (isOpen: boolean) => void }>
}>

// Felder unter der Lebensmittelart: Bezeichnung, Packung, Behälter, Lagerort, Nährwerte und bei
// einer unbestätigten Schätzung der Schalter „Bestätigen“ (#49, #115).
export function ProductEditFields(props: ProductEditFieldsProps) {
  const { edit, options, foodType, savedUnit, canConfirmEstimate, nutritionOpen } = props
  const { draft, errors, change } = edit
  const content = parseContentQuantity(draft.content)
  return (
    <>
      <div className="mx-4 flex flex-col gap-4 pt-[22px] breit:mx-6">
        <Field
          label="Bezeichnung"
          name="bezeichnung"
          autoComplete="off"
          hint={`Leer lassen: Name der Lebensmittelart${foodType ? ` („${foodType.name}“)` : ''}`}
          value={draft.name}
          onChange={(event) => change({ name: event.target.value })}
          error={errors.name}
        />
        <Field
          label="Inhalt je Packung"
          name="inhalt"
          autoComplete="off"
          hint="Mit Einheit: g, kg, ml oder l"
          value={draft.content}
          onChange={(event) => change({ content: event.target.value })}
          error={errors.content}
        />
      </div>
      <ChoiceChips
        label="Behälter"
        choices={options.containers}
        selectedId={draft.containerId}
        onChange={(containerId) => change({ containerId })}
        emptyText="Keine Behälter hinterlegt."
      />
      <ChoiceChips
        label="Lagerort"
        choices={options.storageLocations}
        selectedId={draft.storageLocationId}
        onChange={(storageLocationId) => change({ storageLocationId })}
        emptyText="Noch keine Lagerorte angelegt. Ohne Lagerort geht es auch."
      />
      <NutritionFields
        values={draft.nutrition}
        onChange={(field, value) => change({ nutrition: { ...draft.nutrition, [field]: value } })}
        errors={errors}
        foodType={foodType}
        unit={content.ok ? content.value.unit : savedUnit}
        isOpen={nutritionOpen.isOpen}
        onToggle={nutritionOpen.onToggle}
      />
      {canConfirmEstimate ? (
        <div className="mx-4 mt-3 rounded-group bg-surface px-4 breit:mx-6 breit:border breit:border-line">
          <Toggle
            label="Geschätzte Nährwerte bestätigen"
            name="schaetzung-bestaetigen"
            checked={draft.confirmEstimate}
            onChange={(event) => change({ confirmEstimate: event.target.checked })}
          />
        </div>
      ) : null}
    </>
  )
}
