// Notfall-Befehl passwort-zuruecksetzen <benutzername> (EINSTELLUNGEN_NUTZER §3.4).
import { randomInt } from 'node:crypto'
import { resetPasswordFromCli } from '../../src/features/auth/application/reset-password-from-cli'
import { createPasswordResetRepository } from '../../src/features/auth/data/password-reset-repository'
import { generateTemporaryPassword } from '../../src/features/auth/domain/temporary-password'
import { createAuth } from '../../src/server/auth/auth'
import type { Database } from '../../src/server/db/connection'
import type { Env } from '../../src/shared/config/env'
import { fail, INVALID_USERNAME, leaveTrace, print, unknownUser } from './output'

async function hashWithBetterAuth(db: Database, env: Env) {
  const auth = createAuth({
    db,
    secret: env.APP_SECRET,
    clientIpHeader: env.CLIENT_IP_HEADER,
    secureCookies: env.NODE_ENV === 'production',
    log: () => undefined,
  })
  // Derselbe Hash wie bei der Anmeldung, damit Better Auth das Passwort wieder prüfen kann.
  const { password } = await auth.$context
  return (plain: string) => password.hash(plain)
}

export async function resetPassword(db: Database, env: Env, username: string): Promise<void> {
  const result = await resetPasswordFromCli(
    {
      repository: createPasswordResetRepository(db),
      hashPassword: await hashWithBetterAuth(db, env),
      generatePassword: () => generateTemporaryPassword((size) => randomInt(size)),
      now: () => new Date(),
    },
    username,
  )
  if (!result.ok) {
    fail(result.error.kind === 'not-found' ? unknownUser(username) : INVALID_USERNAME)
    return
  }
  const { password, isActive } = result.value
  leaveTrace('Passwort per Kommandozeile zurückgesetzt', { username: result.value.username })
  print(`\nNeues vorläufiges Passwort für „${result.value.username}“: ${password}`)
  print('Es wird nur jetzt angezeigt. Alle Sitzungen und Anmeldesperren sind aufgehoben.')
  if (!isActive) print('Achtung: Dieser Nutzer ist deaktiviert und kann sich so nicht anmelden.')
}
