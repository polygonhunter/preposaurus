// Sitzung lesen (EINSTELLUNGEN_NUTZER §4.1): je Anfrage gegen die DB, ohne Cookie-Zwischenspeicher.
// Rolle und Status kommen deshalb immer frisch aus nutzer. Ein deaktivierter Nutzer gilt sofort als
// abgemeldet, auch wenn seine Sitzung noch nicht beendet wurde.
import 'server-only'
import type { USER_ROLES } from '@/shared/config/constants'
import type { Auth } from './auth'

export type SessionUser = Readonly<{
  id: string
  name: string
  username: string
  role: (typeof USER_ROLES)[number]
  householdId: string | null
}>

export async function readSession(auth: Auth, headers: Headers): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } })
  if (!session?.user.isActive) return null
  const { id, name, username, role, householdId } = session.user
  return { id, name, username: username ?? '', role, householdId: householdId ?? null }
}
