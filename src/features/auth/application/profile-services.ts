// Verdrahtung für „Mein Konto“ (#75): DB, Better Auth, ob Mails eingerichtet sind, und die Uhr.
// Die Use-Cases bekommen alles übergeben und bleiben mit Test-DB und Test-Auth prüfbar.
import 'server-only'
import type { Auth } from '@/server/auth/auth'
import { getAuth } from '@/server/auth/get-auth'
import type { Database } from '@/server/db/connection'
import { getDb } from '@/server/db/get-db'
import { loadEnv } from '@/shared/config/env'
import {
  createSignInLockRepository,
  type SignInLockRepository,
} from '../data/sign-in-lock-repository'

export type ProfileServices = Readonly<{
  db: Database
  auth: Auth
  /** Bremse für falsche alte Passwörter, dieselbe Tabelle wie die Anmeldebremse */
  locks: SignInLockRepository
  /** SMTP_HOST gesetzt: Ohne Mailversand ist die Check-in-Mail nicht wählbar (#89) */
  isMailConfigured: boolean
  now: () => Date
}>

export async function profileServices(): Promise<ProfileServices> {
  const db = await getDb()
  return {
    db,
    auth: await getAuth(),
    locks: createSignInLockRepository(db),
    isMailConfigured: loadEnv().SMTP_HOST !== undefined,
    now: () => new Date(),
  }
}
