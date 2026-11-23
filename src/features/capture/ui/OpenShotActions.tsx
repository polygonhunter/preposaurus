import { Button } from '@/shared/ui/Button'
import type { DateShot } from './photo-capture-state'
import type { ShotResolution } from './photo-shots'

export interface ShotHandlers {
  resolve: (resolution: ShotResolution) => void
  /** Datumsfeld fokussieren, das Foto gilt dann als „eingetippt“ */
  typeIn: () => void
  readAgain: () => void
  estimate: () => void
}

type OpenShotActionsProps = Readonly<{ issue: DateShot['issue']; handlers: ShotHandlers }>

// Die Wege, ein offenes MHD-Foto zu lösen (#65): bestätigen, nochmal lesen, eintippen, „Datum
// fehlt“, auf Wahl schätzen lassen (#124) oder entfernen. Während es gelesen wird, gibt es nichts.
export function OpenShotActions({ issue, handlers }: OpenShotActionsProps) {
  const { resolve, typeIn, readAgain, estimate } = handlers
  if (issue === 'pending') return null
  return (
    <div className="flex flex-wrap gap-2">
      {issue === 'review' ? (
        <Button
          variant="tinted"
          onClick={() => {
            resolve('confirm')
          }}
        >
          Stimmt
        </Button>
      ) : null}
      {issue === 'not-read' ? (
        <Button variant="tinted" onClick={readAgain}>
          Nochmal lesen
        </Button>
      ) : null}
      <Button variant="tinted" onClick={typeIn}>
        Datum eintippen
      </Button>
      {issue === 'review' ? null : (
        <Button
          variant="tinted"
          onClick={() => {
            resolve('missing')
          }}
        >
          Datum fehlt
        </Button>
      )}
      {issue === 'unreadable' ? (
        <Button variant="tinted" onClick={estimate}>
          Von der KI schätzen lassen
        </Button>
      ) : null}
      <Button
        variant="plain"
        onClick={() => {
          resolve('remove')
        }}
      >
        Entfernen
      </Button>
    </div>
  )
}
