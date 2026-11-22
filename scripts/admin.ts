// Notfall-Befehle auf dem NAS (EINSTELLUNGEN_NUTZER §3.4). Im Image als scripts/admin.mjs:
//   docker compose exec web node scripts/admin.mjs <befehl> [benutzername]
// Nur als Befehl im Container: keine Route, kein Formular, keine Umgebungsvariable. Wer
// docker compose exec ausführen darf, hat ohnehin Zugriff auf DB, Fotos und .env.
import { resetPassword } from './admin/reset-password'
import { fail } from './admin/output'
import { listUsers, makeAdmin, signOutEveryone } from './admin/user-commands'
import { connectDatabase } from '../src/server/db/client'
import type { Database } from '../src/server/db/connection'
import { loadEnv, type Env } from '../src/shared/config/env'

type Command = Readonly<{
  usage: string
  needsUsername: boolean
  run: (db: Database, env: Env, username: string) => Promise<void>
}>

const COMMANDS: Readonly<Record<string, Command>> = {
  'nutzer-auflisten': { usage: 'nutzer-auflisten', needsUsername: false, run: listUsers },
  'admin-machen': {
    usage: 'admin-machen <benutzername>',
    needsUsername: true,
    run: (db, _env, username) => makeAdmin(db, username),
  },
  'passwort-zuruecksetzen': {
    usage: 'passwort-zuruecksetzen <benutzername>',
    needsUsername: true,
    run: resetPassword,
  },
  'alle-abmelden': { usage: 'alle-abmelden', needsUsername: false, run: signOutEveryone },
}

const USAGE = [
  'Aufruf: node scripts/admin.mjs <befehl>',
  ...Object.values(COMMANDS).map((command) => `  ${command.usage}`),
].join('\n')

function findCommand(args: readonly string[]): Command | null {
  const command = Object.hasOwn(COMMANDS, args[0] ?? '') ? COMMANDS[args[0] ?? ''] : undefined
  if (command === undefined) return null
  return args.length === (command.needsUsername ? 2 : 1) ? command : null
}

async function main(args: readonly string[]): Promise<void> {
  const command = findCommand(args)
  if (command === null) {
    fail(USAGE)
    return
  }
  const env = loadEnv()
  const connection = await connectDatabase(env.DATABASE_URL)
  try {
    await command.run(connection.db, env, args[1] ?? '')
  } finally {
    await connection.close()
  }
}

await main(process.argv.slice(2))
