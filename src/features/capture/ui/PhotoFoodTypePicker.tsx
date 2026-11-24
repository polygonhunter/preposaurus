import { flushSync } from 'react-dom'
import type { CaptureOptions } from '../domain/capture-options'
import { FoodTypePicker } from './FoodTypePicker'
import { FoodTypeProposalOffer } from './FoodTypeProposalOffer'
import type { ManualCaptureView } from './manual-capture-view'
import type { PhotoCaptureState } from './photo-capture-state'
import type { PhotoEditor } from './use-photo-capture'

type PhotoFoodTypePickerProps = Readonly<{
  options: CaptureOptions
  state: PhotoCaptureState
  view: ManualCaptureView
  editor: PhotoEditor
  error: string | undefined
}>

/** Fokus per name wie im Formular (FIELD_INPUTS): Suchfeld der Art bzw. Inhalt */
const focusByName = (name: 'lebensmittelart' | 'inhalt') => {
  document.getElementsByName(name)[0]?.focus()
}

// Lebensmittelart im Schritt Verpackung (#62): dieselbe Suche wie im Formular samt „+ Neue
// Lebensmittelart“ (#110). Fand die Erkennung keine passende Art, steht ihr Vorschlag einer neuen
// darüber, als Angebot (#142).
export function PhotoFoodTypePicker({
  options,
  state,
  view,
  editor,
  error,
}: PhotoFoodTypePickerProps) {
  const proposal = state.foodTypeProposal
  return (
    <FoodTypePicker
      foodTypes={options.foodTypes}
      recentIds={options.recentFoodTypeIds}
      selected={view.foodType}
      onSelect={(foodTypeId) => {
        editor.edit({ foodTypeId })
      }}
      error={error}
      adding={{
        categories: options.categories,
        onAdded: editor.chooseFoodType,
      }}
      notice={
        proposal === null ? null : (
          <FoodTypeProposalOffer
            proposal={proposal}
            options={options}
            onChosen={(foodType) => {
              // Angebot samt Blatt sofort weg, dann geht es mit dem Inhalt weiter
              flushSync(() => {
                editor.chooseFoodType(foodType)
              })
              focusByName('inhalt')
            }}
            onDismiss={() => {
              editor.edit({ foodTypeProposal: null })
              focusByName('lebensmittelart')
            }}
          />
        )
      }
    />
  )
}
