import { Field } from '@/shared/ui/Field'
import type { CaptureOptions } from '../domain/capture-options'
import { BestBeforeEntries } from './BestBeforeEntries'
import { CaptureSummaryGroup } from './CaptureSummaryGroup'
import { ChoiceChips } from './ChoiceChips'
import { FoodTypePicker } from './FoodTypePicker'
import type { ManualCaptureView } from './manual-capture-view'
import { NewProductExtras } from './NewProductExtras'
import { ProductMatchOffer } from './ProductMatchOffer'
import type { useManualCapture } from './use-manual-capture'

type ManualCaptureFieldsProps = Readonly<{
  options: CaptureOptions
  capture: ReturnType<typeof useManualCapture>
  view: ManualCaptureView
  nutritionOpen: Readonly<{ isOpen: boolean; onToggle: (isOpen: boolean) => void }>
  /** Nach der Wahl der Art geht es mit dem Inhalt weiter */
  onFoodTypeChosen: () => void
}>

// Ein Formular auf einer Seite (UX §8.5, D11): Lebensmittelart · Packung (Inhalt, Behälter) ·
// MHD und Anzahl · Lagerort · Nährwerte · Zusammenfassung. Der Behälter steht vor dem MHD, weil er
// fürs Wiedererkennen zählt. Beim Nachschub entfallen Lagerort und Nährwerte: Sie gehören zum Produkt.
export function ManualCaptureFields({
  options,
  capture,
  view,
  nutritionOpen,
  onFoodTypeChosen,
}: ManualCaptureFieldsProps) {
  const { draft, errors, change, lookUpMatches } = capture
  const isRestock = draft.existingProductId !== null
  return (
    <>
      <FoodTypePicker
        foodTypes={options.foodTypes}
        recentIds={options.recentFoodTypeIds}
        selected={view.foodType}
        onSelect={(foodTypeId) => {
          void lookUpMatches(change({ foodTypeId }))
          if (foodTypeId !== null) onFoodTypeChosen()
        }}
        error={errors.foodTypeId}
      />
      <div className="mx-4 pt-[22px] breit:mx-6">
        <Field
          label="Inhalt je Packung"
          name="inhalt"
          autoComplete="off"
          placeholder="z. B. 500 g"
          hint="Mit Einheit: g, kg, ml oder l"
          value={draft.content}
          onChange={(event) => change({ content: event.target.value })}
          onBlur={() => void lookUpMatches(draft)}
          error={errors.content}
        />
      </div>
      <ChoiceChips
        label="Behälter"
        choices={options.containers}
        selectedId={draft.containerId}
        onChange={(containerId) => void lookUpMatches(change({ containerId }))}
        emptyText="Keine Behälter hinterlegt."
      />
      <ProductMatchOffer
        matches={capture.matches}
        chosenId={draft.existingProductId}
        onChoose={(existingProductId) => change({ existingProductId })}
      />
      <BestBeforeEntries
        entries={draft.units}
        onChange={(units) => change({ units })}
        error={errors.units}
      />
      {isRestock ? null : (
        <NewProductExtras
          storageLocations={options.storageLocations}
          capture={capture}
          view={view}
          nutritionOpen={nutritionOpen}
        />
      )}
      {view.summary === null ? null : (
        <CaptureSummaryGroup
          summary={view.summary}
          storageLocationName={view.storageLocationName}
        />
      )}
    </>
  )
}
