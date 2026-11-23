// Gemeinsame Sätze und Helfer der Actions der Nutzerverwaltung (#41, #123). Mitglieder sehen die
// Formulare nicht. Kommt trotzdem eine Anfrage an, gibt es einen ruhigen Satz statt einer Änderung.
import type { ManageUserError } from '../application/manage-users'
import type { PasswordProblem } from '../domain/password-rules'

export type UserActionState = Readonly<{
  status: 'idle' | 'saved' | 'error'
  message: string | null
}>

export const USER_ACTION_IDLE: UserActionState = { status: 'idle', message: null }

export const USER_GONE = 'Diesen Nutzer gibt es nicht mehr. Bitte lade die Seite neu.'

export const OWN_PASSWORD = 'Dein eigenes Passwort setzt ein anderer Admin zurück.'

export const LAST_ADMIN =
  'Ihr braucht mindestens einen Admin. Mach zuerst jemand anderen zum Admin.'

// Ruhig und mit Ausweg, ohne Stärke-Balken (EINSTELLUNGEN_NUTZER §4.4).
export const COMMON_PASSWORD =
  'Dieses Passwort ist sehr verbreitet und schnell erraten. Ein Satz oder ein paar Wörter sind gut.'

export const PASSWORD_PROBLEM_MESSAGES: Record<PasswordProblem, string> = {
  'contains-app-name': 'Bitte ein Passwort ohne „Preposaurus“.',
  'common-password': COMMON_PASSWORD,
  'contains-username': 'Bitte ein Passwort ohne den Benutzernamen.',
  'contains-display-name': 'Bitte ein Passwort ohne den Anzeigenamen.',
  'contains-household-name': 'Bitte ein Passwort ohne den Namen des Haushalts.',
}

export function manageErrorMessage(error: ManageUserError): string {
  switch (error.kind) {
    case 'not-found':
      return USER_GONE
    case 'last-admin':
      return LAST_ADMIN
    case 'self':
      return 'Dein eigenes Konto deaktiviert ein anderer Admin.'
    case 'member-not-found':
      return 'Diese Person gibt es nicht mehr. Bitte lade die Seite neu.'
  }
}

export const failed = (message: string): UserActionState => ({ status: 'error', message })
