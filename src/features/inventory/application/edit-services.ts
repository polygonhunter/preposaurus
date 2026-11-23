// Verdrahtung für Bearbeiten und Löschen im Vorrat (#49, #50): Repositories auf der Verbindung
// des Serverprozesses und der Foto-Speicher aus der Umgebung. Die Use-Cases bekommen ihre Ports
// weiter übergeben, Tests setzen Fakes ein.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import { createPhotoStorage } from '@/server/storage/create-photo-storage'
import { loadEnv } from '@/shared/config/env'
import { createEntryEraseRepository } from '../data/entry-erase-repository'
import { createUnitDateRepository } from '../data/unit-date-repository'
import type { DeleteEntryDeps } from './delete-entry'
import type { UnitDateEditor } from './unit-date-editor'

export async function unitDateEditor(): Promise<UnitDateEditor> {
  return createUnitDateRepository(await getDb())
}

export async function deleteEntryDeps(): Promise<DeleteEntryDeps> {
  return {
    eraser: createEntryEraseRepository(await getDb()),
    storage: createPhotoStorage(loadEnv()),
  }
}
