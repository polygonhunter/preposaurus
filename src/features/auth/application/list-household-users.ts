// Liste der Nutzerverwaltung (#41): Rolle, Status, letzte Anmeldung und verknüpfte Person. Nur für
// den Admin, die Seite prüft das vorher.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import {
  createUserAdminRepository,
  type HouseholdUser,
  type UserAdminRepository,
} from '../data/user-admin-repository'

export type { HouseholdUser }

export async function listHouseholdUsers(
  repository: Pick<UserAdminRepository, 'list'>,
  householdId: string,
): Promise<HouseholdUser[]> {
  return repository.list(householdId)
}

export async function userAdminRepository(): Promise<UserAdminRepository> {
  return createUserAdminRepository(await getDb())
}
