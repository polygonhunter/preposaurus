import { useRef, type ChangeEvent } from 'react'

type ShutterProps = Readonly<{
  /** Live-Bild vorhanden: Der Auslöser nimmt das Videobild, sonst öffnet er die Dateiauswahl */
  isLive: boolean
  onCapture: () => void
  onFile: (file: File) => void
  label: string
}>

const RING =
  'flex size-[72px] items-center justify-center rounded-full border-4 border-fg transition-transform duration-150 ease-out active:scale-95'
const CORE = 'size-[56px] rounded-full bg-fg'

// Auslöser 72 px (DESIGN_SYSTEM §7). Ohne Live-Kamera ist es ein Dateifeld mit
// `capture="environment"`: Auf dem Handy öffnet das die Kamera-App, am PC die Dateiauswahl.
export function Shutter({ isLive, onCapture, onFile, label }: ShutterProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Gleiches Foto zweimal wählen soll wieder auslösen.
    event.target.value = ''
    if (file !== undefined) onFile(file)
  }

  if (isLive) {
    return (
      <button type="button" aria-label={label} onClick={onCapture} className={RING}>
        <span aria-hidden="true" className={CORE} />
      </button>
    )
  }
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={pick}
        hidden
      />
      <button
        type="button"
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        className={RING}
      >
        <span aria-hidden="true" className={CORE} />
      </button>
    </>
  )
}
