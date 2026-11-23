// Gemeinsame Sätze der Haushalts-Actions. Ein Mitglied sieht die Formulare gar nicht, landet eine
// Anfrage trotzdem hier, bekommt es einen ruhigen Satz statt einer Änderung.
import type { AccessError } from '@/server/auth/guards'

export const MEMBER_GONE = 'Diese Person gibt es nicht mehr. Bitte lade die Seite neu.'

export function accessMessage(error: AccessError): string {
  switch (error.kind) {
    case 'unauthenticated':
      return 'Bitte melde dich erneut an.'
    case 'forbidden':
      return 'Das ändert ein Admin.'
  }
}

/** Antwort einfacher Formulare mit einer Einstellung */
export type SettingState = Readonly<{ status: 'idle' | 'saved' | 'error'; message: string | null }>

export const SETTING_IDLE: SettingState = { status: 'idle', message: null }
