import { cx } from '@/shared/lib/class-names'
import { Button } from '@/shared/ui/Button'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import type { CaptureErrors } from './manual-capture-draft'

type PhotoSaveBarProps = Readonly<{
  errors: CaptureErrors
  /** Was das Speichern gerade sperrt, sonst null (saveBlocker) */
  blocker: string | null
  /** Speichern wurde trotz Sperre angetippt: Grund rot und angesagt */
  isBlockerShown: boolean
  isSaving: boolean
  onDiscard: () => Promise<void>
}>

const firstMessage = (errors: CaptureErrors) => Object.values(errors).find(Boolean) ?? null

// Speichern und Verwerfen am Ende des Schritts Prüfen. Was das Speichern sperrt, steht als Satz am
// Knopf (UX §8.5 „Speichern gesperrt“), schon vor dem Antippen. Fehler je Feld stehen am Feld.
export function PhotoSaveBar(props: PhotoSaveBarProps) {
  const { errors, blocker, isBlockerShown, isSaving, onDiscard } = props
  return (
    <>
      <LiveMessage message={firstMessage(errors) ?? (isBlockerShown ? blocker : null)} />
      <div className="mx-4 flex flex-col gap-3 pt-8 breit:mx-6">
        {errors.form ? <p className="px-4 text-footnote text-red">{errors.form}</p> : null}
        {!errors.form && blocker !== null ? (
          <p className={cx('px-4 text-footnote', isBlockerShown ? 'text-red' : 'text-fg2')}>
            {blocker}
          </p>
        ) : null}
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
