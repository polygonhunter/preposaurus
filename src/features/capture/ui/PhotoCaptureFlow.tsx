'use client'
import { discardDraftAction } from '../actions/discard-draft-action'
import type { CaptureOptions } from '../domain/capture-options'
import { CameraView } from './CameraView'
import { CaptureSaved } from './CaptureSaved'
import { deriveView } from './manual-capture-view'
import type { PhotoCaptureState } from './photo-capture-state'
import { PhotoReview } from './PhotoReview'
import { PhotoSaveBar } from './PhotoSaveBar'
import { saveBlocker } from './photo-shots'
import { usePhotoCapture } from './use-photo-capture'
import { useSavePhotoCapture } from './use-save-photo-capture'

type PhotoCaptureFlowProps = Readonly<{
  options: CaptureOptions
  initial: PhotoCaptureState
  recognitionOff: string | null
  /** „Noch eins“ und „Verwerfen“: frischer Stand */
  onRestart: () => void
}>

/** name-Attribut der Felder, damit der Fokus beim Speichern zum ersten Fehler springt */
const FIELD_INPUTS: Record<string, string> = {
  foodTypeId: 'lebensmittelart',
  content: 'inhalt',
  units: 'mhd',
  kcal: 'kcal',
  protein: 'eiweiss',
  carbs: 'kohlenhydrate',
  fat: 'fett',
}

function focusField(field: string) {
  const name = FIELD_INPUTS[field]
  if (name !== undefined) document.getElementsByName(name)[0]?.focus()
}

// Ein Durchlauf der Foto-Erfassung: Kamera, Prüfen, Speichern, danach die Bestätigung.
export function PhotoCaptureFlow(props: PhotoCaptureFlowProps) {
  const { options, initial, recognitionOff, onRestart } = props
  const saving = useSavePhotoCapture(focusField)
  const { state, editor, matches, estimates } = usePhotoCapture({
    options,
    initial,
    isActive: saving.saved === null,
    recognitionOff,
  })
  const draft = { ...state, captureId: '', isKcalEstimate: state.nutritionSource === 'ai-estimate' }
  const view = deriveView(options, draft)

  if (saving.saved !== null) {
    return (
      <CaptureSaved
        unitCount={saving.saved.unitCount}
        productName={view.productName}
        isFirst={options.isStockEmpty}
        onAnother={onRestart}
      />
    )
  }
  if (state.isCameraOpen) {
    return (
      <CameraView
        step={state.step}
        onPhoto={editor.takePhoto}
        onClose={editor.closeCamera}
        onSkipTable={editor.skipTable}
        notice={recognitionOff}
        dates={{ units: state.units, shots: state.shots }}
      />
    )
  }
  return (
    <form
      noValidate
      aria-label="Foto-Erfassung prüfen"
      className="pb-6 breit:max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault()
        void saving.submit(state)
      }}
    >
      <PhotoReview
        {...{ options, state, view, editor, matches, estimates }}
        errors={saving.errors}
      />
      <PhotoSaveBar
        errors={saving.errors}
        blocker={saveBlocker(state)}
        isBlockerShown={saving.isBlockerShown}
        isSaving={saving.isSaving}
        onDiscard={async () => {
          if (state.draftId !== null) await discardDraftAction({ entwurfId: state.draftId })
          onRestart()
        }}
      />
    </form>
  )
}
