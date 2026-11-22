import type { NamedChoice } from '../domain/capture-options'
import { ChoiceChips } from './ChoiceChips'
import type { ManualCaptureView } from './manual-capture-view'
import { NutritionFields } from './NutritionFields'
import type { useManualCapture } from './use-manual-capture'

type NewProductExtrasProps = Readonly<{
  storageLocations: readonly NamedChoice[]
  capture: ReturnType<typeof useManualCapture>
  view: ManualCaptureView
  nutritionOpen: Readonly<{ isOpen: boolean; onToggle: (isOpen: boolean) => void }>
}>

// Angaben, die nur ein neues Produkt braucht: Lagerort (vorbelegt mit dem zuletzt genutzten) und
// Nährwerte. Beim Nachschub zu einem vorhandenen Produkt gelten dessen Werte.
export function NewProductExtras({
  storageLocations,
  capture,
  view,
  nutritionOpen,
}: NewProductExtrasProps) {
  const { draft, errors, change } = capture
  return (
    <>
      <ChoiceChips
        label="Lagerort"
        choices={storageLocations}
        selectedId={draft.storageLocationId}
        onChange={(storageLocationId) => change({ storageLocationId })}
        emptyText="Noch keine Lagerorte angelegt. Ohne Lagerort geht es auch."
      />
      <NutritionFields
        values={draft.nutrition}
        onChange={(field, value) => change({ nutrition: { ...draft.nutrition, [field]: value } })}
        errors={errors}
        foodType={view.foodType}
        unit={view.contentUnit}
        isOpen={nutritionOpen.isOpen}
        onToggle={nutritionOpen.onToggle}
      />
    </>
  )
}
