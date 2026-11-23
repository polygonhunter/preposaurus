// Gemeinsamer Anfang von Erkennung und Schätzung: Foto aus einem eigenen Entwurf, KI-Konfiguration
// des Haushalts (jeder Aufruf landet über prepareRecognition in `ki_aufruf`), erst dann die Datei.
// Ein fremdes oder unbekanntes Foto ist „nicht gefunden“, ohne einen einzigen KI-Aufruf.
import 'server-only'
import type { AiConfigError } from '@/features/ai-settings/application/ai-config-service'
import {
  prepareRecognition,
  type PreparedRecognition,
} from '@/features/ai-settings/application/prepare-recognition'
import type { AiImage } from '@/server/ai/vision-recognizer'
import type { AiRole } from '@/shared/config/ai-roles'
import { err, ok, type Result } from '@/shared/lib/result'
import { findOwnDraftPhoto, type DraftPhoto } from '../data/photo-repository'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'
import { photoKeysFor } from './photo-files'

export type DraftPhotoError =
  { kind: 'not-found' } | { kind: 'ai-unavailable'; reason: AiConfigError['kind'] }

export interface PreparedDraftPhoto {
  photo: DraftPhoto
  prepared: PreparedRecognition
  image: AiImage
}

interface PrepareDraftPhotoInput {
  actor: CaptureActor
  photoId: string
  /** Pflichtrollen, abhängig von der Rolle des Fotos */
  rolesFor: (photo: DraftPhoto) => { required: AiRole[]; optional: AiRole[] }
}

type PrepareDeps = Pick<CaptureDeps, 'db' | 'storage' | 'env'>

/** Fehler von prepareRecognition. Ein fremdes Foto (#168) ist für den Nutzer „nicht gefunden“. */
function unavailable(error: AiConfigError | { kind: 'photo-not-found' }): DraftPhotoError {
  return error.kind === 'photo-not-found'
    ? { kind: 'not-found' }
    : { kind: 'ai-unavailable', reason: error.kind }
}

export async function prepareDraftPhoto(
  deps: PrepareDeps,
  input: PrepareDraftPhotoInput,
): Promise<Result<PreparedDraftPhoto, DraftPhotoError>> {
  const photo = await findOwnDraftPhoto(deps.db, input.actor, input.photoId)
  if (photo === null) return err({ kind: 'not-found' })
  const roles = input.rolesFor(photo)
  const prepared = await prepareRecognition(deps, {
    householdId: photo.householdId,
    photoId: photo.id,
    ...roles,
  })
  if (!prepared.ok) return err(unavailable(prepared.error))
  const keys = photoKeysFor({ householdId: photo.householdId, photoId: photo.id })
  const data = await deps.storage.read(keys.full)
  if (data === null) return err({ kind: 'not-found' })
  // Der Upload speichert immer JPEG (photo-processor), die DB-Spalte braucht es hier nicht.
  return ok({ photo, prepared: prepared.value, image: { data, mimeType: 'image/jpeg' } })
}
