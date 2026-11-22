// Notfall-Befehl alle-abmelden (EINSTELLUNGEN_NUTZER §3.2, §3.4): beendet alle Sitzungen aller
// Nutzer, z. B. nach dem Einspielen eines alten oder fremden Backups, das alte Sitzungs-Token
// zurückbringt (INSTALLATION §11). Wirkt sofort, weil Better Auth hier keinen Cookie-Cache nutzt
// (server/auth/auth.ts). Anders als ein neues APP_SECRET bleibt ein hinterlegter KI-Schlüssel lesbar.
import 'server-only'
import type { EmergencyUserRepository } from '../data/emergency-user-repository'

/** Liefert die Zahl der beendeten Sitzungen. */
export async function signOutEveryoneFromCli(
  repository: Pick<EmergencyUserRepository, 'endAllSessions'>,
): Promise<number> {
  return repository.endAllSessions()
}
