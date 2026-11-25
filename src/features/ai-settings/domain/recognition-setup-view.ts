// Was der Schritt „Foto-Erkennung einrichten“ der Einrichtung zeigt (#314). Eine Verbindung aus der
// Umgebung hat Vorrang und lässt sich in der App nicht ändern: Dann nennt der Schritt sie nur. Ist
// die Erkennung schon eingerichtet und an (z. B. nach „Zurück“), braucht es kein Formular mehr.
import type { AiSettingsOverview } from './ai-settings-overview'

export type RecognitionSetupView =
  | Readonly<{ kind: 'env'; provider: 'anthropic' | 'fake' }>
  | Readonly<{ kind: 'ready' }>
  | Readonly<{ kind: 'form' }>

export function recognitionSetupView(
  overview: Pick<AiSettingsOverview, 'envConnection' | 'status'>,
): RecognitionSetupView {
  if (overview.envConnection !== null) return { kind: 'env', provider: overview.envConnection }
  return overview.status === 'ready' ? { kind: 'ready' } : { kind: 'form' }
}
