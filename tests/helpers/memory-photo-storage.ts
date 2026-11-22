// Fake-Adapter für Tests (nie produktiv, deshalb unter tests/helpers): hält Fotos im Speicher. Die Uhr ist einstellbar, damit Tests das
// Alter von Dateien steuern können (Aufräumen erst ab 24 Stunden).
import type { PhotoKey } from '@/server/storage/photo-key'
import { describeStoredPhoto, type PhotoStorage } from '@/server/storage/photo-storage'

interface MemoryEntry {
  data: Uint8Array
  modifiedAt: Date
}

type Clock = () => Date

/** Kopien rein und raus, damit Aufrufer den Inhalt nicht nachträglich verändern. */
export function createMemoryPhotoStorage(now: Clock = () => new Date()): PhotoStorage {
  const files = new Map<PhotoKey, MemoryEntry>()
  return {
    save: (key, file) =>
      Promise.try(() => {
        const stored = describeStoredPhoto(key, file)
        files.set(key, { data: file.data.slice(), modifiedAt: now() })
        return stored
      }),
    read: (key) => Promise.try(() => files.get(key)?.data.slice() ?? null),
    delete: (key) =>
      Promise.try(() => {
        files.delete(key)
      }),
    list: () =>
      Promise.try(() => [...files].map(([key, entry]) => ({ key, modifiedAt: entry.modifiedAt }))),
  }
}
