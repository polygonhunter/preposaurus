// Auswahl des Foto-Speichers aus der Konfiguration (CODE_PRINZIPIEN §8: Factory per ENV).
import 'server-only'
import type { Env } from '@/shared/config/env'
import { createLocalFileStorage } from './local-file-storage'
import type { PhotoStorage } from './photo-storage'

export function createPhotoStorage(env: Pick<Env, 'PHOTO_STORAGE_DIR'>): PhotoStorage {
  return createLocalFileStorage(env.PHOTO_STORAGE_DIR)
}
