import { Button } from '@/shared/ui/Button'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import type { CaptureErrors } from './manual-capture-draft'

type PhotoSaveBarProps = Readonly<{
  errors: CaptureErrors
  isSaving: boolean
  onDiscard: () => Promise<void>
}>

const firstMessage = (errors: CaptureErrors) => Object.values(errors).find(Boolean) ?? null

// Speichern und Verwerfen am Ende des Schritts Prüfen. Was das Speichern sperrt, steht als Satz am
// Knopf (UX §8.5 „Speichern gesperrt“), Fehler je Feld stehen am Feld.
export function PhotoSaveBar({ errors, isSaving, onDiscard }: PhotoSaveBarProps) {
  return (
    <>
      <LiveMessage message={firstMessage(errors)} />
      <div className="mx-4 flex flex-col gap-3 pt-8 breit:mx-6">
        {errors.form ? <p className="px-4 text-footnote text-red">{errors.form}</p> : null}
        <Button type="submit" pendingLabel={isSaving ? 'Speichert …' : undefined}>
          Speichern
        </Button>
        <Button variant="destructive" onClick={() => void onDiscard()}>
          Erfassung verwerfen
        </Button>
      </div>
    </>
  )
}
