import { Button } from '@/shared/ui/Button'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { Reading } from './photo-capture-state'

type ReadingNoticeProps = Readonly<{
  reading: Reading
  /** Fehlende Angaben nach der Erkennung, z. B. „Inhalt“ */
  missing: readonly string[]
  /** Nur mit hochgeladenem Foto möglich */
  onReadAgain: (() => void) | null
}>

// Stand der Erkennung für einen Abschnitt (UX §8.5 „Zustände“): wird gelesen, Vorschlag zum Prüfen,
// Nicht Erkanntes gelb mit Wort, Fehlschlag mit „Nochmal“. Es wird nie etwas geraten.
export function ReadingNotice({ reading, missing, onReadAgain }: ReadingNoticeProps) {
  if (reading.state === 'idle') return null
  return (
    <div role="status" className="flex flex-col gap-1.5 px-8 pb-2 text-footnote breit:px-10">
      {reading.state === 'reading' ? <span className="text-fg2">wird gelesen …</span> : null}
      {reading.state === 'done' ? (
        <span className="text-fg2">Vorschlag der Erkennung. Bitte prüfen.</span>
      ) : null}
      {reading.state === 'done' && missing.length > 0 ? (
        <StatusBadge tone="yellow" label={`Nicht erkannt: ${missing.join(', ')}`} />
      ) : null}
      {reading.state === 'failed' || reading.state === 'unavailable' ? (
        <span className="text-fg2">{reading.message}</span>
      ) : null}
      {reading.state === 'failed' && onReadAgain !== null ? (
        <span>
          <Button variant="tinted" onClick={onReadAgain}>
            Nochmal
          </Button>
        </span>
      ) : null}
    </div>
  )
}
