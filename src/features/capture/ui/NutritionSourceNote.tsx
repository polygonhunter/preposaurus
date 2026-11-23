import { Button } from '@/shared/ui/Button'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { PhotoCaptureState } from './photo-capture-state'

type NutritionSourceNoteProps = Readonly<{
  state: Pick<PhotoCaptureState, 'nutritionSource' | 'isEstimateConfirmed'>
  onConfirm: () => void
  onDiscard: () => void
}>

// Herkunft der Nährwerte (UX §4): vom Etikett oder geschätzt. Eine Schätzung ist mit „ca.“
// markiert und muss gesondert bestätigt werden (#115), sonst sperrt sie das Speichern.
export function NutritionSourceNote({ state, onConfirm, onDiscard }: NutritionSourceNoteProps) {
  if (state.nutritionSource === 'label') {
    return <p className="px-8 text-footnote text-fg2 breit:px-10">Vom Etikett gelesen.</p>
  }
  if (state.nutritionSource !== 'ai-estimate') return null
  if (state.isEstimateConfirmed) {
    return (
      <p className="px-8 text-footnote text-fg2 breit:px-10">
        ca., von der KI geschätzt und bestätigt.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2 px-8 breit:px-10">
      <StatusBadge tone="yellow" label="ca., von der KI geschätzt: bitte bestätigen" />
      <div className="flex flex-wrap gap-2">
        <Button variant="tinted" onClick={onConfirm}>
          Schätzung übernehmen
        </Button>
        <Button variant="plain" onClick={onDiscard}>
          Verwerfen
        </Button>
      </div>
    </div>
  )
}
