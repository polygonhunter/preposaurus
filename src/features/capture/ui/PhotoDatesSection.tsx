import { useFocusRescue } from '@/shared/hooks/use-focus-rescue'
import { Button } from '@/shared/ui/Button'
import { BestBeforeEntries } from './BestBeforeEntries'
import { OpenShotList } from './OpenShotList'
import type { PhotoCaptureState } from './photo-capture-state'
import type { PhotoEditor } from './use-photo-capture'

type PhotoDatesSectionProps = Readonly<{
  state: PhotoCaptureState
  editor: PhotoEditor
  error: string | undefined
  estimateNote: string | null
}>

// MHD je Packung (#64, #65): ein Chip je Datum mit Anzahl, offene Fotos zum Entscheiden, Eintippen
// und „Datum fehlt“ wie im Formular. Eine KI-Schätzung gibt es nur auf Wahl und als „geschätzt“.
// Ist ein offenes Foto entschieden, verschwindet es samt Knopf; useFocusRescue führt den Fokus zum
// nächsten offenen Foto oder zur Liste der Daten (#269).
export function PhotoDatesSection({ state, editor, error, estimateNote }: PhotoDatesSectionProps) {
  const focusRef = useFocusRescue<HTMLDivElement>(false)
  return (
    <div ref={focusRef} className="contents">
      <OpenShotList state={state} editor={editor} />
      <BestBeforeEntries
        entries={state.units}
        onChange={(units) => {
          editor.edit({ units })
        }}
        error={error}
      />
      <div className="mx-4 flex flex-col gap-2 pt-3 breit:mx-6">
        <span>
          <Button
            variant="tinted"
            onClick={() => {
              editor.openCamera('mhd')
            }}
          >
            MHD fotografieren
          </Button>
        </span>
        {estimateNote === null ? null : (
          <p role="status" className="px-4 text-footnote text-fg2">
            {estimateNote}
          </p>
        )}
      </div>
    </div>
  )
}
