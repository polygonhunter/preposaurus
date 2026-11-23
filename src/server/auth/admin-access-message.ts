// Ruhiger Satz, wenn eine Admin-Action ohne Admin-Rechte ankommt (#37). Mitglieder sehen die
// Formulare gar nicht, landet eine Anfrage trotzdem hier, gibt es diesen Satz statt einer Änderung.
import type { AccessError } from './guards'

export function adminAccessMessage(error: AccessError): string {
  switch (error.kind) {
    case 'unauthenticated':
      return 'Bitte melde dich erneut an.'
    case 'forbidden':
      return 'Das ändert ein Admin.'
  }
}
