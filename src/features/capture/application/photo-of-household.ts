// Gehört ein Foto zum Haushalt? Für andere Features, die eine Foto-ID weiterreichen, z. B. die
// Protokollzeile eines KI-Aufrufs (#133). Die Abfrage steht nur im Foto-Repository (#171).
import 'server-only'
import type { Database } from '@/server/db/connection'
import { existsPhotoOfHousehold } from '../data/photo-repository'

export function isPhotoOfHousehold(
  db: Database,
  ref: { householdId: string; photoId: string },
): Promise<boolean> {
  return existsPhotoOfHousehold(db, ref)
}
