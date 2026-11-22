// Notfall-Befehle nutzer-auflisten, admin-machen <benutzername> und alle-abmelden
// (EINSTELLUNGEN_NUTZER §3.4). Änderungen hinterlassen eine Spur im Log von web.
import { listUsersFromCli } from '../../src/features/auth/application/list-users-from-cli'
import { makeAdminFromCli } from '../../src/features/auth/application/make-admin-from-cli'
import { signOutEveryoneFromCli } from '../../src/features/auth/application/sign-out-everyone-from-cli'
import { createEmergencyUserRepository } from '../../src/features/auth/data/emergency-user-repository'
import type { Database } from '../../src/server/db/connection'
import { fail, INVALID_USERNAME, leaveTrace, print, unknownUser } from './output'
import { formatUserTable } from './user-table'

export async function listUsers(db: Database): Promise<void> {
  print(formatUserTable(await listUsersFromCli(createEmergencyUserRepository(db))))
}

export async function makeAdmin(db: Database, username: string): Promise<void> {
  const result = await makeAdminFromCli(createEmergencyUserRepository(db), username)
  if (!result.ok) {
    fail(result.error.kind === 'not-found' ? unknownUser(username) : INVALID_USERNAME)
    return
  }
  const { username: name, wasAdmin, wasActive } = result.value
  leaveTrace('Nutzer per Kommandozeile zum Admin gemacht', { username: name, wasAdmin, wasActive })
  if (wasAdmin && wasActive) {
    print(`„${name}“ war schon ein aktiver Admin. Nichts geändert.`)
    return
  }
  print(`„${name}“ ist jetzt ein aktiver Admin.`)
  print(`Passwort vergessen? Dann: node scripts/admin.mjs passwort-zuruecksetzen ${name}`)
}

export async function signOutEveryone(db: Database): Promise<void> {
  const ended = await signOutEveryoneFromCli(createEmergencyUserRepository(db))
  leaveTrace('Alle Sitzungen per Kommandozeile beendet', { endedSessions: ended })
  print(`Alle Geräte sind abgemeldet (${String(ended)} Sitzungen beendet).`)
  print('Jeder meldet sich mit seinem Passwort neu an.')
}
