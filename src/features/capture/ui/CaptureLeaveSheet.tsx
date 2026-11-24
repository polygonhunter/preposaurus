'use client'
import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Sheet } from '@/shared/ui/Sheet'
import type { LeaveGuard } from './capture-leave'

type CaptureLeaveSheetProps = Readonly<{
  /** Stand beim Antippen von „Abbrechen“, null: Blatt zu */
  guard: LeaveGuard | null
  onStay: () => void
  onLeave: () => void
}>

type Pending = 'keep' | 'discard' | null

const TEXTS = {
  unsaved: 'Eure Eingaben sind noch nicht gespeichert. Wenn ihr jetzt geht, sind sie weg.',
  draft:
    'Fotos und Angaben liegen als Entwurf auf dem NAS. Beim nächsten Erfassen könnt ihr ihn fortsetzen oder verwerfen.',
} as const

// Ruhige Rückfrage vor dem Verlassen (#285). Der sichere Weg steht oben: ungespeicherte Eingaben
// bleiben mit „Weiter erfassen“, ein Entwurf mit „Für später behalten“. Escape und der Hintergrund
// schließen das Blatt und lassen alles, wie es ist; der Fokus kehrt dann auf „Abbrechen“ zurück.
export function CaptureLeaveSheet({ guard, onStay, onLeave }: CaptureLeaveSheetProps) {
  const [pending, setPending] = useState<Pending>(null)
  const [message, setMessage] = useState<string | null>(null)
  const isOpen = guard !== null && guard.kind !== 'none'

  async function run(kind: Exclude<Pending, null>, step: () => Promise<string | null>) {
    setPending(kind)
    const failure = await step()
    setPending(null)
    setMessage(failure)
    if (failure === null) onLeave()
  }

  function stay() {
    setMessage(null)
    onStay()
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={stay}
      title="Erfassung abbrechen?"
      actions={
        guard?.kind === 'draft' ? (
          <>
            <Button
              pendingLabel={pending === 'keep' ? 'Sichert …' : undefined}
              onClick={() => void run('keep', guard.keep)}
            >
              Für später behalten
            </Button>
            <Button
              variant="destructive"
              pendingLabel={pending === 'discard' ? 'Verwirft …' : undefined}
              onClick={() => void run('discard', guard.discard)}
            >
              Verwerfen
            </Button>
            <Button variant="plain" onClick={stay}>
              Weiter erfassen
            </Button>
          </>
        ) : (
          <>
            <Button onClick={stay}>Weiter erfassen</Button>
            <Button variant="destructive" onClick={onLeave}>
              Verwerfen
            </Button>
          </>
        )
      }
    >
      <p>{guard?.kind === 'draft' ? TEXTS.draft : TEXTS.unsaved}</p>
      {message === null ? null : (
        <p role="alert" className="pt-2 text-footnote text-red">
          {message}
        </p>
      )}
    </Sheet>
  )
}
