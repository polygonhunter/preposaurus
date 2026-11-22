// Notfall-Befehle auf dem NAS (EINSTELLUNGEN_NUTZER §3.4). Im Image als scripts/admin.mjs:
//   docker compose exec web node scripts/admin.mjs passwort-zuruecksetzen <benutzername>
// Nur als Befehl im Container: keine Route, kein Formular, keine Umgebungsvariable. Wer
// docker compose exec ausführen darf, hat ohnehin Zugriff auf DB, Fotos und .env.
import { randomInt } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { resetPasswordFromCli } from '../src/features/auth/application/reset-password-from-cli'
import { createPasswordResetRepository } from '../src/features/auth/data/password-reset-repository'
import { generateTemporaryPassword } from '../src/features/auth/domain/temporary-password'
import { createAuth } from '../src/server/auth/auth'
import { connectDatabase } from '../src/server/db/client'
import type { Database } from '../src/server/db/connection'
import { loadEnv, type Env } from '../src/shared/config/env'
import { createLogger } from '../src/shared/lib/logger'

const USAGE = 'Aufruf: node scripts/admin.mjs passwort-zuruecksetzen <benutzername>'
// Ausgabe des Hauptprozesses im Container: So steht die Spur auch in "docker compose logs web".
const CONTAINER_LOG = '/proc/1/fd/1'

const print = (text: string) => process.stdout.write(`${text}\n`)
const fail = (text: string) => {
  process.stderr.write(`${text}\n`)
  process.exitCode = 1
}

function writeLogLine(line: string): void {
  print(line)
  try {
    appendFileSync(CONTAINER_LOG, `${line}\n`)
  } catch {
    // Außerhalb des Containers gibt es dieses Ziel nicht. Die Zeile steht dann nur im Terminal.
  }
}

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

async function resetPassword(db: Database, env: Env, username: string): Promise<void> {
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
    fail(
      result.error.kind === 'not-found'
        ? `Einen Nutzer „${username}“ gibt es nicht.`
        : 'Der Benutzername hat 3 bis 30 Zeichen: Buchstaben, Ziffern, Punkt oder Unterstrich.',
    )
    return
  }
  const { password, isActive } = result.value
  createLogger({ level: 'info', sink: writeLogLine }).warn(
    'Passwort per Kommandozeile zurückgesetzt',
    { username: result.value.username },
  )
  print(`\nNeues vorläufiges Passwort für „${result.value.username}“: ${password}`)
  print('Es wird nur jetzt angezeigt. Alle Sitzungen und Anmeldesperren sind aufgehoben.')
  if (!isActive) print('Achtung: Dieser Nutzer ist deaktiviert und kann sich so nicht anmelden.')
}

async function main(args: readonly string[]): Promise<void> {
  const [command, username] = args
  if (command !== 'passwort-zuruecksetzen' || username === undefined || args.length !== 2) {
    fail(USAGE)
    return
  }
  const env = loadEnv()
  const connection = await connectDatabase(env.DATABASE_URL)
  try {
    await resetPassword(connection.db, env, username)
  } finally {
    await connection.close()
  }
}

await main(process.argv.slice(2))
