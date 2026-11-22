// Notfall-Befehl nutzer-auflisten (EINSTELLUNGEN_NUTZER §3.4): Wer hat welches Konto, wer ist Admin,
// wer ist aktiv? Hilft vor admin-machen und passwort-zuruecksetzen, den richtigen Namen zu finden.
// Nur Übersichtsfelder, nie Hashes oder Sitzungen.
import 'server-only'
import type { EmergencyUserRepository, UserOverview } from '../data/emergency-user-repository'

export async function listUsersFromCli(
  repository: Pick<EmergencyUserRepository, 'listUsers'>,
): Promise<UserOverview[]> {
  return repository.listUsers()
}
