// Abhängigkeiten der Erfassung für Routen und Actions: DB, Foto-Speicher und Bildverarbeitung.
// Use-Cases bekommen sie übergeben, Tests setzen Test-DB und Fake-Speicher ein.
import 'server-only'
import type { Database } from '@/server/db/connection'
import { getDb } from '@/server/db/get-db'
import { createPhotoStorage } from '@/server/storage/create-photo-storage'
import type { PhotoProcessor } from '@/server/storage/photo-processor'
import type { PhotoStorage } from '@/server/storage/photo-storage'
import { createSharpPhotoProcessor } from '@/server/storage/sharp-photo-processor'
import { loadEnv } from '@/shared/config/env'

export interface CaptureDeps {
  db: Database
  storage: PhotoStorage
  processor: PhotoProcessor
}

export async function loadCaptureDeps(): Promise<CaptureDeps> {
  return {
    db: await getDb(),
    storage: createPhotoStorage(loadEnv()),
    processor: createSharpPhotoProcessor(),
  }
}
