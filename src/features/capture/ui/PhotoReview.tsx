import type { CaptureOptions, NamedChoice } from '../domain/capture-options'
import { CaptureSummaryGroup } from './CaptureSummaryGroup'
import type { CaptureErrors } from './manual-capture-draft'
import type { ManualCaptureView } from './manual-capture-view'
import type { PhotoCaptureState } from './photo-capture-state'
import { PhotoDatesSection } from './PhotoDatesSection'
import { PhotoNutritionSection } from './PhotoNutritionSection'
import { PhotoPackagingSection } from './PhotoPackagingSection'
import { PhotoStrip } from './PhotoStrip'
import { ProductMatchOffer } from './ProductMatchOffer'
import { StorageLocationChoice } from './StorageLocationChoice'
import type { PhotoEditor } from './use-photo-capture'
import type { usePhotoEstimate } from './use-photo-estimate'
import type { ProductMatch } from './use-product-matches'

type PhotoReviewProps = Readonly<{
  options: CaptureOptions
  state: PhotoCaptureState
  view: ManualCaptureView
  editor: PhotoEditor
  errors: CaptureErrors
  matches: readonly ProductMatch[]
  estimates: ReturnType<typeof usePhotoEstimate>
  onStorageLocationAdded: (location: NamedChoice) => void
}>

// Schritt Prüfen (UX §8.5 Schritt 4): alle Vorschläge auf einer Seite, jedes Feld änderbar, dazu
// dieselbe Zusammenfassung wie im Formular. Beim Nachschub entfallen Lagerort und Nährwerte.
export function PhotoReview(props: PhotoReviewProps) {
  const { options, state, view, editor, errors, matches, estimates } = props
  const isRestock = state.existingProductId !== null
  return (
    <>
      <PhotoStrip photos={state.photos} onRetry={editor.retryUpload} />
      <PhotoPackagingSection {...{ options, state, view, editor, errors }} />
      <ProductMatchOffer
        matches={matches}
        chosen={view.chosenMatch}
        onChoose={editor.chooseProduct}
      />
      {isRestock ? null : (
        <>
          <StorageLocationChoice
            locations={options.storageLocations}
            selectedId={state.storageLocationId}
            onChange={(storageLocationId) => {
              editor.edit({ storageLocationId })
            }}
            onAdded={props.onStorageLocationAdded}
          />
          <PhotoNutritionSection
            {...{ state, view, editor, errors }}
            estimate={{
              isRunning: estimates.running === 'naehrwerte',
              note: estimates.noteFor('naehrwerte'),
            }}
          />
        </>
      )}
      <PhotoDatesSection
        state={state}
        editor={editor}
        error={errors.units}
        estimateNote={estimates.noteFor('mhd')}
      />
      {view.summary === null ? null : (
        <CaptureSummaryGroup
          summary={view.summary}
          storageLocationName={view.storageLocationName}
        />
      )}
    </>
  )
}
