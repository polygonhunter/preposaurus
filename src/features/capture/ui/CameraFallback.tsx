import { Button } from '@/shared/ui/Button'
import type { CameraStatus } from './use-camera'

type CameraFallbackProps = Readonly<{
  status: Exclude<CameraStatus, 'live'>
  onManual: () => void
}>

const MESSAGES: Record<CameraFallbackProps['status'], string> = {
  starting: 'Kamera startet …',
  denied:
    'Kein Zugriff auf die Kamera. Ihr könnt ihn in den Einstellungen des Geräts erlauben. Bis dahin geht alles von Hand, oder ihr wählt ein Foto über den Auslöser.',
  unavailable:
    'Hier gibt es keine Live-Kamera. Der Auslöser öffnet die Kamera-App oder die Dateiauswahl, oder ihr tragt alles von Hand ein.',
}

// Ohne Live-Bild (UX §8.5 „Kamera nicht erlaubt“): ruhiger Satz, „Von Hand eintragen“ als
// Hauptknopf. Der Auslöser bleibt als Dateiauswahl nutzbar.
export function CameraFallback({ status, onManual }: CameraFallbackProps) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="max-w-sm text-body text-fg2" role="status">
        {MESSAGES[status]}
      </p>
      {status === 'starting' ? null : (
        <div className="w-full max-w-xs">
          <Button onClick={onManual}>Von Hand eintragen</Button>
        </div>
      )}
    </div>
  )
}
