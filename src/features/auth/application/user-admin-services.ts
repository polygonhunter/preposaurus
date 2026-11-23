// Verdrahtung der Nutzerverwaltung (#41, #123): Repositories, der Passwort-Hash von Better Auth und
// ein Zufallsgenerator für vorläufige Passwörter. Die Use-Cases bekommen alles übergeben.
import 'server-only'
import { randomInt } from 'node:crypto'
import { getAuth } from '@/server/auth/get-auth'
import { getDb } from '@/server/db/get-db'
import {
  createPasswordResetRepository,
  type PasswordResetRepository,
} from '../data/password-reset-repository'
import { createUserAdminRepository, type UserAdminRepository } from '../data/user-admin-repository'
import { generateTemporaryPassword } from '../domain/temporary-password'

export type UserAdminServices = Readonly<{
  users: UserAdminRepository
  passwords: Pick<PasswordResetRepository, 'resetPassword'>
  hashPassword: (password: string) => Promise<string>
  generatePassword: () => string
  now: () => Date
}>

export async function userAdminServices(): Promise<UserAdminServices> {
  const db = await getDb()
  const { password } = await (await getAuth()).$context
  return {
    users: createUserAdminRepository(db),
    passwords: createPasswordResetRepository(db),
    hashPassword: (plain) => password.hash(plain),
    generatePassword: () => generateTemporaryPassword((size) => randomInt(size)),
    now: () => new Date(),
  }
}
