// Aufräumen verwaister Dateien (technik.html „Wann wird gespeichert“): Dateien ohne DB-Zeile
// werden erst gelöscht, wenn sie älter als 24 Stunden sind. Das schützt Fotos, deren Upload
// gerade läuft und deren DB-Zeile noch fehlt.
import type { PhotoKey } from './photo-key'
import type { PhotoStorage, StoredFileInfo } from './photo-storage'

const HOUR_MS = 3_600_000
/** @internal Nur für Tests exportiert, im Code nur in dieser Datei genutzt. */
export const ORPHAN_MIN_AGE_MS = 24 * HOUR_MS

interface OrphanSelection {
  files: readonly StoredFileInfo[]
  /** Schlüssel, die in der DB (Tabelle `foto`) stehen */
  referencedKeys: ReadonlySet<string>
  now: Date
}

/**
 * Dateien ohne DB-Zeile, die mindestens 24 Stunden alt sind.
 * @internal Nur für Tests exportiert, im Code nur in dieser Datei genutzt.
 */
export function selectOrphanedFiles({ files, referencedKeys, now }: OrphanSelection): PhotoKey[] {
  const latestModified = now.getTime() - ORPHAN_MIN_AGE_MS
  return files
    .filter((file) => !referencedKeys.has(file.key))
    .filter((file) => file.modifiedAt.getTime() <= latestModified)
    .map((file) => file.key)
}

interface OrphanCleanup {
  storage: PhotoStorage
  referencedKeys: ReadonlySet<string>
  now: Date
}

/** Löscht verwaiste Dateien und gibt ihre Schlüssel zurück (für das Protokoll des Jobs). */
export async function deleteOrphanedPhotos({
  storage,
  referencedKeys,
  now,
}: OrphanCleanup): Promise<PhotoKey[]> {
  const orphaned = selectOrphanedFiles({ files: await storage.list(), referencedKeys, now })
  for (const key of orphaned) await storage.delete(key)
  return orphaned
}
