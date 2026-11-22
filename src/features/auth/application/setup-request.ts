// Verdrahtet die Ersteinrichtung mit DB und dem Passwort-Hash von Better Auth.
import 'server-only'
import { getAuth } from '@/server/auth/get-auth'
import { getDb } from '@/server/db/get-db'
import type { Result } from '@/shared/lib/result'
import { createFirstAdminRepository } from '../data/first-admin-repository'
import type { SetupInput } from '../schemas'
import { setupFirstAdmin, type SetupError } from './setup-first-admin'

/** Gibt es schon einen Nutzer? Sonst zeigt die App die Einrichtung statt der Anmeldung. */
export async function isSetUp(): Promise<boolean> {
  return createFirstAdminRepository(await getDb()).hasAnyUser()
}

export async function setupFromRequest(input: SetupInput): Promise<Result<null, SetupError>> {
  const context = await (await getAuth()).$context
  return setupFirstAdmin(
    {
      repository: createFirstAdminRepository(await getDb()),
      hashPassword: (password) => context.password.hash(password),
    },
    input,
  )
}
