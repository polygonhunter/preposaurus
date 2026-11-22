// Foto ausliefern (UMSETZUNG M6-02): nur an den eigenen Haushalt, ein Entwurfsfoto nur an den
// Nutzer seines Entwurfs. Fremde, unbekannte und verworfene Fotos ergeben gleichermaßen
// „nicht gefunden“, damit niemand fremde IDs erraten kann (DATENKATALOG §8 Nr. 3).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { findVisiblePhoto } from '../data/photo-repository'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'
import { photoKeysFor } from './photo-files'

type PhotoVariant = 'full' | 'thumbnail'

interface ReadPhotoInput {
  actor: CaptureActor
  photoId: string
  variant: PhotoVariant
}

export interface PhotoContent {
  data: Uint8Array
  /** Bild und Vorschau entstehen mit demselben Encoder, haben also denselben Typ. */
  mimeType: string
}

export async function readPhoto(
  deps: Pick<CaptureDeps, 'db' | 'storage'>,
  input: ReadPhotoInput,
): Promise<Result<PhotoContent, { kind: 'not-found' }>> {
  const photo = await findVisiblePhoto(deps.db, input.actor, input.photoId)
  if (photo === null) return err({ kind: 'not-found' })
  const keys = photoKeysFor({ householdId: photo.householdId, photoId: photo.id })
  const data = await deps.storage.read(keys[input.variant])
  return data === null ? err({ kind: 'not-found' }) : ok({ data, mimeType: photo.mimeType })
}
