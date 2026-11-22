// Notfall-Befehl admin-machen (EINSTELLUNGEN_NUTZER §3.4), Fall „der einzige Admin ist weg“: Der
// Nutzer wird wieder aktiv und bekommt die Rolle admin. Die Regel der Oberfläche („es bleibt immer
// ein aktiver Admin“, auth/domain/user-rules.ts) kann dabei nicht verletzt werden, weil der Befehl
// nur Rechte gibt und keine nimmt. Passwort und Sitzungen bleiben, dafür gibt es
// passwort-zuruecksetzen.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { EmergencyUserRepository, PromotedUser } from '../data/emergency-user-repository'
import { usernameSchema } from '../schemas'

export type MakeAdminError = { kind: 'invalid-username' } | { kind: 'not-found' }

export async function makeAdminFromCli(
  repository: Pick<EmergencyUserRepository, 'makeActiveAdmin'>,
  rawUsername: string,
): Promise<Result<PromotedUser, MakeAdminError>> {
  const parsed = usernameSchema.safeParse(rawUsername)
  if (!parsed.success) return err({ kind: 'invalid-username' })
  const promoted = await repository.makeActiveAdmin(parsed.data)
  return promoted === null ? err({ kind: 'not-found' }) : ok(promoted)
}
