import { useState } from 'react'
import type { CaptureErrors } from './manual-capture-draft'
import type { ManualCaptureView } from './manual-capture-view'
import { NutritionFields } from './NutritionFields'
import { NutritionTableActions } from './NutritionTableActions'
import { NutritionSourceNote } from './NutritionSourceNote'
import type { PhotoCaptureState } from './photo-capture-state'
import { PortionConverter } from './PortionConverter'
import { ReadingNotice } from './ReadingNotice'
import type { PhotoEditor } from './use-photo-capture'

type PhotoNutritionSectionProps = Readonly<{
  state: PhotoCaptureState
  view: ManualCaptureView
  editor: PhotoEditor
  errors: CaptureErrors
  estimate: Readonly<{ isRunning: boolean; note: string | null }>
}>

const hasValues = (state: PhotoCaptureState) =>
  Object.values(state.nutrition).some((text) => text.trim() !== '')

// Schritt Nährwerte im Prüfen (#63, #115): erst das Foto der Tabelle, sonst „Keine
// Nährwerttabelle“. Dann gilt der Richtwert der Art, eine KI-Schätzung nur auf Wahl und nur nach
// Bestätigung. Eingetippte Werte gelten als eigene Angabe.
export function PhotoNutritionSection(props: PhotoNutritionSectionProps) {
  const { state, view, editor, errors } = props
  const [isOpen, setOpen] = useState(() => hasValues(state) || state.hasNoTable)
  return (
    <section aria-label="Nährwerte">
      <NutritionFields
        values={state.nutrition}
        onChange={(field, value) => {
          editor.edit({
            nutrition: { ...state.nutrition, [field]: value },
            nutritionSource: 'manual',
          })
        }}
        errors={errors}
        foodType={view.foodType}
        unit={view.contentUnit}
        isOpen={isOpen || hasValues(state)}
        onToggle={setOpen}
      />
      <ReadingNotice
        reading={state.readings.naehrwerte}
        missing={[]}
        onReadAgain={editor.readAgainFor('naehrwerte')}
      />
      <NutritionSourceNote
        state={state}
        onConfirm={editor.confirmEstimate}
        onDiscard={editor.discardEstimate}
      />
      {state.isPerPortion ? (
        <PortionConverter
          values={state.nutrition}
          onConverted={(nutrition) => {
            editor.edit({ nutrition, isPerPortion: false })
          }}
        />
      ) : null}
      <NutritionTableActions state={state} editor={editor} estimate={props.estimate} />
    </section>
  )
}
