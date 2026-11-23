// Fehlerfassung endgültig löschen (#50, VOR-07, T#speicherpunkte): nur der Admin, das prüft die
// Action. Erst alle DB-Zeilen in einer Transaktion, danach die Dateien über den Speicher-Port.
// Scheitert eine Datei, bleibt sie ohne DB-Zeile liegen und das Aufräumen verwaister Dateien
// entfernt sie später. Danach fehlt das Gelöschte in Verlauf und Statistik.
import 'server-only'
import { deletePhotoFiles, photoKeysFor } from '@/features/capture/application/photo-files'
import type { PhotoStorage } from '@/server/storage/photo-storage'
import { err, ok, type Result } from '@/shared/lib/result'
import type { DeleteEntryRequest } from '../schemas'
import type { EntryEraser, ErasedPhoto } from './entry-eraser'
import type { NotFound } from './read-context'

export interface DeleteEntryDeps {
  eraser: EntryEraser
  storage: Pick<PhotoStorage, 'delete'>
}

export interface DeletedEntry {
  isProductRemoved: boolean
  /** Fotos, deren Dateien sich nicht löschen ließen (für das Protokoll) */
  leftoverPhotoIds: string[]
}

async function deleteFiles(
  storage: DeleteEntryDeps['storage'],
  photos: readonly ErasedPhoto[],
): Promise<string[]> {
  const results = await Promise.allSettled(
    photos.map((photo) =>
      deletePhotoFiles(
        storage,
        photoKeysFor({ householdId: photo.householdId, photoId: photo.id }),
      ),
    ),
  )
  return photos.filter((_photo, index) => results[index]?.status === 'rejected').map((p) => p.id)
}

export async function deleteEntry(
  deps: DeleteEntryDeps,
  input: Readonly<{ householdId: string; target: DeleteEntryRequest }>,
): Promise<Result<DeletedEntry, NotFound>> {
  const erased = await deps.eraser.eraseRows(input.householdId, input.target)
  if (erased === null) return err({ kind: 'not-found' })
  const leftoverPhotoIds = await deleteFiles(deps.storage, erased.photos)
  return ok({ isProductRemoved: erased.isProductRemoved, leftoverPhotoIds })
}
