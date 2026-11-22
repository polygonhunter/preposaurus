// Port für den Foto-Speicher (CODE_PRINZIPIEN §8). Der Verbraucher kennt nur dieses Interface.
// Adapter: Dateisystem (NAS-Volume) und In-Memory (Tests). Ein Wechsel betrifft eine Datei.
import { createHash } from 'node:crypto'
import type { PhotoKey } from './photo-key'

/** Dateitypen, die gespeichert werden. Hochgeladenes wird vorher umgewandelt (photo-processor). */
export type StoredPhotoType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface PhotoFile {
  data: Uint8Array
  mimeType: StoredPhotoType
}

/** Was in der DB-Zeile `foto` landet: nur die Referenz samt Hash, Größe und Typ. */
export interface StoredPhoto {
  key: PhotoKey
  sha256: string
  sizeBytes: number
  mimeType: StoredPhotoType
}

/** Eine Datei im Speicher, wie das Aufräumen sie sieht. */
export interface StoredFileInfo {
  key: PhotoKey
  modifiedAt: Date
}

export interface PhotoStorage {
  /** Speichert die Datei unter dem Schlüssel. Ein vorhandener Stand wird ersetzt. */
  save: (key: PhotoKey, file: PhotoFile) => Promise<StoredPhoto>
  /** Liest die Datei. Fehlt sie, ergibt das null. */
  read: (key: PhotoKey) => Promise<Uint8Array | null>
  /** Löscht die Datei. Fehlt sie schon, passiert nichts. */
  delete: (key: PhotoKey) => Promise<void>
  /** Alle Dateien, z. B. für das Aufräumen verwaister Dateien. */
  list: () => Promise<StoredFileInfo[]>
}

export function sha256Hex(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

/** Gemeinsam für alle Adapter, damit Hash und Größe überall gleich entstehen. */
export function describeStoredPhoto(key: PhotoKey, file: PhotoFile): StoredPhoto {
  if (file.data.byteLength === 0) throw new Error('Leere Fotodatei kann nicht gespeichert werden.')
  return {
    key,
    sha256: sha256Hex(file.data),
    sizeBytes: file.data.byteLength,
    mimeType: file.mimeType,
  }
}
