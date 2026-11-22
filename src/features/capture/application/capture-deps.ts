// Abhängigkeiten der Erfassung für Routen und Actions: DB, Foto-Speicher, Bildverarbeitung und
// was die KI-Konfiguration aus der Umgebung braucht. Use-Cases bekommen sie übergeben, Tests
// setzen Test-DB, Fake-Speicher und AI_PROVIDER=fake ein.
import 'server-only'
import type { AiConfigEnv } from '@/features/ai-settings/application/ai-config-service'
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
  env: AiConfigEnv
}

export async function loadCaptureDeps(): Promise<CaptureDeps> {
  const env = loadEnv()
  return {
    db: await getDb(),
    storage: createPhotoStorage(env),
    processor: createSharpPhotoProcessor(),
    env,
  }
}
