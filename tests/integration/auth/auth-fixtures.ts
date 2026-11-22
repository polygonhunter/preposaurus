// Probelauf ohne Admin-Plugin (EINSTELLUNGEN_NUTZER Frage 10): Nutzer, Passwort-Hash und
// Sitzungen setzen wir allein über den Server-Kontext von Better Auth ($context). So werden es
// später die Use-Cases der Nutzerverwaltung (M3-10) und die Kommandozeile tun.
import { randomUUID } from 'node:crypto'
import { createAuth, type Auth } from '../../../src/server/auth/auth'
import type { Database } from '../../../src/server/db/connection'

const TEST_SECRET = 'test-nur-zum-testen-kein-geheimnis-0000'
const TEST_IP_HEADER = 'x-forwarded-for'

export function createTestAuth(db: Database): Auth {
  return createAuth({
    db,
    secret: TEST_SECRET,
    clientIpHeader: TEST_IP_HEADER,
    secureCookies: true,
    log: () => undefined,
  })
}

type NewUser = Readonly<{ username: string; password: string; householdId: string }>

/** Legt einen Nutzer mit technischer E-Mail und Passwort an, ohne Registrierung. */
export async function createCredentialUser(auth: Auth, user: NewUser): Promise<string> {
  const context = await auth.$context
  const id = randomUUID()
  await context.internalAdapter.createUser(
    {
      id,
      name: 'Alex',
      email: `${id}@nutzer.invalid`,
      username: user.username,
      householdId: user.householdId,
    },
    { method: 'admin' },
  )
  await context.internalAdapter.linkAccount({
    userId: id,
    providerId: 'credential',
    accountId: id,
    password: await context.password.hash(user.password),
  })
  return id
}

/** Neues Passwort setzen und alle Sitzungen beenden, wie „Passwort zurücksetzen“. */
export async function resetPassword(auth: Auth, userId: string, password: string): Promise<void> {
  const context = await auth.$context
  await context.internalAdapter.updatePassword(userId, await context.password.hash(password))
  await context.internalAdapter.deleteUserSessions(userId)
}

type Credentials = Readonly<{ username: string; password: string; rememberMe?: boolean }>

/** Meldet direkt bei Better Auth an und liefert die Header, die der Browser danach schickt. */
export async function signInForCookie(auth: Auth, credentials: Credentials) {
  const { headers } = await auth.api.signInUsername({
    body: { rememberMe: true, ...credentials },
    returnHeaders: true,
  })
  const setCookie = headers.get('set-cookie') ?? ''
  const cookie = setCookie
    .split(/,(?=\s*[\w.-]+=)/)
    .map((part) => part.split(';')[0]?.trim())
    .join('; ')
  return { setCookie, requestHeaders: new Headers({ cookie }) }
}
