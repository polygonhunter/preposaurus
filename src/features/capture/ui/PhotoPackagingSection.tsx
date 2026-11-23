import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import type { CaptureOptions } from '../domain/capture-options'
import { ChoiceChips } from './ChoiceChips'
import { FoodTypePicker } from './FoodTypePicker'
import type { CaptureErrors } from './manual-capture-draft'
import type { ManualCaptureView } from './manual-capture-view'
import type { PhotoCaptureState } from './photo-capture-state'
import { ReadingNotice } from './ReadingNotice'
import type { PhotoEditor } from './use-photo-capture'

type PhotoPackagingSectionProps = Readonly<{
  options: CaptureOptions
  state: PhotoCaptureState
  view: ManualCaptureView
  editor: PhotoEditor
  errors: CaptureErrors
}>

function missingOf(state: PhotoCaptureState): string[] {
  const missing: [boolean, string][] = [
    [state.foodTypeId === null, 'Lebensmittelart'],
    [state.content.trim() === '', 'Inhalt'],
    [state.containerId === null, 'Behälter'],
  ]
  return missing.filter(([isMissing]) => isMissing).map(([, label]) => label)
}

// Schritt Verpackung im Prüfen (#62): Die Erkennung füllt Lebensmittelart, Bezeichnung, Inhalt,
// Behälter und Abtropfgewicht als Vorschlag. Alles bleibt änderbar, Nicht Erkanntes ist gelb.
export function PhotoPackagingSection(props: PhotoPackagingSectionProps) {
  const { options, state, view, editor, errors } = props
  return (
    <>
      <FoodTypePicker
        foodTypes={options.foodTypes}
        recentIds={options.recentFoodTypeIds}
        selected={view.foodType}
        onSelect={(foodTypeId) => {
          editor.edit({ foodTypeId })
        }}
        error={errors.foodTypeId}
      />
      <ReadingNotice
        reading={state.readings.verpackung}
        missing={missingOf(state)}
        onReadAgain={editor.readAgainFor('verpackung')}
      />
      <div className="mx-4 flex flex-col gap-4 pt-[22px] breit:mx-6">
        <Field
          label="Bezeichnung (freiwillig)"
          name="bezeichnung"
          autoComplete="off"
          placeholder={view.foodType?.name ?? 'z. B. Spaghetti'}
          value={state.name}
          onChange={(event) => {
            editor.edit({ name: event.target.value })
          }}
        />
        <Field
          label="Inhalt je Packung"
          name="inhalt"
          autoComplete="off"
          placeholder="z. B. 500 g"
          hint="Mit Einheit: g, kg, ml oder l"
          value={state.content}
          onChange={(event) => {
            editor.edit({ content: event.target.value })
          }}
          onBlur={editor.leaveContent}
          error={errors.content}
        />
        <Field
          label="Abtropfgewicht in g (freiwillig)"
          name="abtropfgewicht"
          inputMode="decimal"
          autoComplete="off"
          value={state.drainedWeight}
          onChange={(event) => {
            editor.edit({ drainedWeight: event.target.value })
          }}
        />
      </div>
      <ChoiceChips
        label="Behälter"
        choices={options.containers}
        selectedId={state.containerId}
        onChange={(containerId) => {
          editor.edit({ containerId })
        }}
        emptyText="Keine Behälter hinterlegt."
      />
      <div className="mx-4 pt-3 breit:mx-6">
        <Button
          variant="tinted"
          onClick={() => {
            editor.openCamera('verpackung')
          }}
        >
          Verpackung fotografieren
        </Button>
      </div>
    </>
  )
}
