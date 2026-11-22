// Dateien eines Fotos im Speicher: verkleinertes Bild und Vorschau. `foto.pfad` hält das Bild,
// die Vorschau liegt nach derselben Regel daneben. So genügt eine DB-Zeile für beide Dateien.
import 'server-only'
import { buildPhotoKey, type PhotoKey } from '@/server/storage/photo-key'
import type { PhotoStorage } from '@/server/storage/photo-storage'

export interface PhotoKeys {
  full: PhotoKey
  thumbnail: PhotoKey
}

interface PhotoIds {
  householdId: string
  photoId: string
}

function keyFor(ids: PhotoIds, variant: 'full' | 'thumbnail'): PhotoKey {
  const key = buildPhotoKey({ ...ids, variant })
  // IDs sind UUIDs aus App und DB. Ein unsicherer Schlüssel wäre ein Fehler im Code.
  if (key === null) throw new Error('Ungültige ID für einen Fotoschlüssel')
  return key
}

export function photoKeysFor(ids: PhotoIds): PhotoKeys {
  return { full: keyFor(ids, 'full'), thumbnail: keyFor(ids, 'thumbnail') }
}

/** Löscht beide Dateien. Fehlt eine, passiert nichts (Port-Vertrag). */
export async function deletePhotoFiles(storage: PhotoStorage, keys: PhotoKeys): Promise<void> {
  await Promise.all([storage.delete(keys.full), storage.delete(keys.thumbnail)])
}
