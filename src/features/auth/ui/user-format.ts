// Texte der Nutzerverwaltung (#41): Rolle, Status und letzte Anmeldung, Zeit in Deutschland.
import type { USER_ROLES } from '@/shared/config/constants'

type UserRole = (typeof USER_ROLES)[number]

export const ROLE_LABELS: Record<UserRole, string> = { admin: 'Admin', mitglied: 'Mitglied' }

export const ROLE_OPTIONS = [
  { value: 'mitglied', label: ROLE_LABELS.mitglied },
  { value: 'admin', label: ROLE_LABELS.admin },
]

const SIGN_IN_FORMAT = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** „23.11.2026, 08:30“ in deutscher Zeit, ohne Zeitpunkt „noch nie“ */
export function formatSignInTime(time: Date | null): string {
  return time === null ? 'noch nie' : SIGN_IN_FORMAT.format(time)
}

function formatLastSignIn(lastSignInAt: Date | null): string {
  return lastSignInAt === null ? 'noch nie angemeldet' : `zuletzt ${formatSignInTime(lastSignInAt)}`
}

type UserLine = Readonly<{
  role: UserRole
  isActive: boolean
  lastSignInAt: Date | null
  memberName: string | null
}>

/** Zweitzeile: „Admin · zuletzt 23.11.2026, 08:30 · ist Alex“ bzw. „deaktiviert“ statt der Rolle */
export function userSummary(user: UserLine): string {
  const status = user.isActive ? ROLE_LABELS[user.role] : `${ROLE_LABELS[user.role]}, deaktiviert`
  const member = user.memberName === null ? null : `zählt als ${user.memberName}`
  return [status, formatLastSignIn(user.lastSignInAt), member]
    .filter((part) => part !== null)
    .join(' · ')
}
