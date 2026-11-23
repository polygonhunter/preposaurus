import { Button } from '@/shared/ui/Button'
import type { PhotoCaptureState } from './photo-capture-state'
import type { PhotoEditor } from './use-photo-capture'

type NutritionTableActionsProps = Readonly<{
  state: PhotoCaptureState
  editor: PhotoEditor
  estimate: Readonly<{ isRunning: boolean; note: string | null }>
}>

// Erst das Foto der Tabelle, sonst „Keine Nährwerttabelle“ (#115). Erst danach gibt es die
// KI-Schätzung, und nur auf ausdrückliche Wahl (#124). Eigene Werte ersetzt sie nicht.
export function NutritionTableActions({ state, editor, estimate }: NutritionTableActionsProps) {
  const hasTablePhoto = state.photos.some((photo) => photo.role === 'naehrwerte')
  const hasOwnValues =
    state.nutritionSource === 'manual' &&
    Object.values(state.nutrition).some((text) => text.trim() !== '')
  const canEstimate = state.hasNoTable && state.nutritionSource !== 'ai-estimate' && !hasOwnValues
  return (
    <div className="mx-4 flex flex-col gap-2 pt-3 breit:mx-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="tinted"
          onClick={() => {
            editor.openCamera('naehrwerte')
          }}
        >
          Nährwerttabelle fotografieren
        </Button>
        {hasTablePhoto || state.hasNoTable ? null : (
          <Button variant="plain" onClick={editor.skipTable}>
            Keine Nährwerttabelle
          </Button>
        )}
        {canEstimate ? (
          <Button
            variant="tinted"
            pendingLabel={estimate.isRunning ? 'Schätzt …' : undefined}
            onClick={() => {
              editor.estimate('naehrwerte')
            }}
          >
            Von der KI schätzen lassen
          </Button>
        ) : null}
      </div>
      {estimate.note === null ? null : (
        <p role="status" className="px-4 text-footnote text-fg2">
          {estimate.note}
        </p>
      )}
    </div>
  )
}
