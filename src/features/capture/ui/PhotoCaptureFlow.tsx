'use client'
import { useRef, type ReactNode } from 'react'
import { useIsBreit } from '@/shared/hooks/use-is-breit'
import { discardDraftAction } from '../actions/discard-draft-action'
import type { CaptureOptions } from '../domain/capture-options'
import { CameraView } from './CameraView'
import { CaptureSaved } from './CaptureSaved'
import { deriveView } from './manual-capture-view'
import type { PhotoCaptureState } from './photo-capture-state'
import { PhotoCaptureLayout } from './PhotoCaptureLayout'
import { PhotoReview } from './PhotoReview'
import { PhotoSaveBar } from './PhotoSaveBar'
import { saveBlocker } from './photo-shots'
import { usePhotoCapture } from './use-photo-capture'
import { usePhotoLeaveGuard } from './use-photo-leave-guard'
import { useSavePhotoCapture } from './use-save-photo-capture'

type PhotoCaptureFlowProps = Readonly<{
  options: CaptureOptions
  initial: PhotoCaptureState
  recognitionOff: string | null
  /** „Noch eins“ und „Verwerfen“: frischer Stand */
  onRestart: () => void
  /** Der frische Stand lädt noch (useFreshRestart) */
  isRestarting: boolean
  /** Titel und Umschalter, ab „breit“ rechts neben der Kamera */
  header: ReactNode
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

const FORM_CONTROLS = 'input, select, textarea, button'

// Ein Durchlauf der Foto-Erfassung: Kamera, Prüfen, Speichern, danach die Bestätigung. Kompakt
// verdeckt die Kamera alles, ab „breit“ wächst der Vorschlag rechts neben ihr (PhotoCaptureLayout).
export function PhotoCaptureFlow(props: PhotoCaptureFlowProps) {
  const { options, initial, recognitionOff, onRestart } = props
  const isBreit = useIsBreit()
  const saving = useSavePhotoCapture(focusField)
  const { state, editor, matches, estimates } = usePhotoCapture({
    options,
    initial,
    isActive: saving.saved === null,
    recognitionOff,
  })
  usePhotoLeaveGuard({
    initial,
    state,
    containers: options.containers,
    isSaved: saving.saved !== null,
  })
  const draft = { ...state, captureId: '', isKcalEstimate: state.nutritionSource === 'ai-estimate' }
  const view = deriveView(options, draft)
  const isCameraShown = state.isCameraOpen && saving.saved === null
  const isReviewShown = !state.isCameraOpen || isBreit
  const formRef = useRef<HTMLFormElement>(null)

  // Ab „breit“ steht das Formular schon neben der Kamera: Der Fokus geht hinein, statt mit dem
  // Knopf „Kamera schließen“ zu verschwinden. Kompakt setzt ihn das neu eingehängte Formular.
  function closeCamera() {
    if (isBreit) formRef.current?.querySelector<HTMLElement>(FORM_CONTROLS)?.focus()
    editor.closeCamera()
  }

  return (
    <PhotoCaptureLayout
      header={props.header}
      camera={
        isCameraShown ? (
          <CameraView
            step={state.step}
            onPhoto={editor.takePhoto}
            onClose={closeCamera}
            onSkipTable={editor.skipTable}
            notice={recognitionOff}
            dates={{ units: state.units, shots: state.shots }}
          />
        ) : null
      }
    >
      {saving.saved === null ? null : (
        <CaptureSaved
          saved={saving.saved}
          productName={view.productName}
          isFirst={options.isStockEmpty}
          isReloading={props.isRestarting}
          onAnother={onRestart}
        />
      )}
      {saving.saved === null && isReviewShown ? (
        <form
          ref={formRef}
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
      ) : null}
    </PhotoCaptureLayout>
  )
}
