import type { NamedChoice } from '../domain/capture-options'
import type { ManualCaptureView } from './manual-capture-view'
import { NutritionFields } from './NutritionFields'
import { StorageLocationChoice } from './StorageLocationChoice'
import type { useManualCapture } from './use-manual-capture'

type NewProductExtrasProps = Readonly<{
  storageLocations: readonly NamedChoice[]
  onStorageLocationAdded: (location: NamedChoice) => void
  capture: ReturnType<typeof useManualCapture>
  view: ManualCaptureView
  nutritionOpen: Readonly<{ isOpen: boolean; onToggle: (isOpen: boolean) => void }>
}>

// Angaben, die nur ein neues Produkt braucht: Lagerort (vorbelegt mit dem zuletzt genutzten, neu anlegbar, #301) und
// Nährwerte. Beim Nachschub zu einem vorhandenen Produkt gelten dessen Werte.
export function NewProductExtras({
  storageLocations,
  onStorageLocationAdded,
  capture,
  view,
  nutritionOpen,
}: NewProductExtrasProps) {
  const { draft, errors, change } = capture
  return (
    <>
      <StorageLocationChoice
        locations={storageLocations}
        selectedId={draft.storageLocationId}
        onChange={(storageLocationId) => change({ storageLocationId })}
        onAdded={onStorageLocationAdded}
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
