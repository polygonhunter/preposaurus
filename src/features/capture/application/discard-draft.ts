// Entwurf verwerfen (UMSETZUNG M6-03, technik.html „Aufräumen“): erst die DB (Entwurf und seine
// Entwurfsfotos in einer Transaktion), dann die Dateien. Scheitert danach eine Datei, bleibt sie
// ohne DB-Zeile liegen und das Aufräumen verwaister Dateien entfernt sie nach 24 Stunden.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { deleteOwnDraft, findDraft } from '../data/draft-repository'
import { deleteDraftPhotos, listDraftPhotos, type DraftPhoto } from '../data/photo-repository'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'
import { deletePhotoFiles, photoKeysFor } from './photo-files'

interface DiscardDraftInput {
  actor: CaptureActor
  draftId: string
}

export interface DiscardedDraft {
  removedPhotos: number
  /** Fotos, deren Dateien sich nicht löschen ließen (für das Protokoll) */
  leftoverPhotoIds: string[]
}

type Database = CaptureDeps['db']

/**
 * Gehört der Entwurf dem Nutzer: Fotozeilen und Entwurf löschen, sonst null. Die Fotos zuerst,
 * weil das Löschen des Entwurfs ihren Verweis leert (ON DELETE SET NULL) und sie dann nicht
 * mehr zu finden wären. Feste Fotos (schon bestätigt) bleiben stehen.
 */
function deleteRows(db: Database, { actor, draftId }: DiscardDraftInput) {
  return db.transaction(async (tx): Promise<DraftPhoto[] | null> => {
    if ((await findDraft(tx, actor, draftId)) === null) return null
    const photos = await listDraftPhotos(tx, draftId)
    await deleteDraftPhotos(tx, draftId)
    await deleteOwnDraft(tx, actor, draftId)
    return photos
  })
}

async function deleteFiles(
  storage: CaptureDeps['storage'],
  photos: readonly DraftPhoto[],
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

export async function discardDraft(
  deps: Pick<CaptureDeps, 'db' | 'storage'>,
  input: DiscardDraftInput,
): Promise<Result<DiscardedDraft, { kind: 'not-found' }>> {
  const photos = await deleteRows(deps.db, input)
  if (photos === null) return err({ kind: 'not-found' })
  const leftoverPhotoIds = await deleteFiles(deps.storage, photos)
  return ok({ removedPhotos: photos.length, leftoverPhotoIds })
}
