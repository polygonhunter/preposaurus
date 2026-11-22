// Foto hochladen (UMSETZUNG M6-02, technik.html „Wann wird gespeichert“): verkleinern, EXIF weg,
// beide Dateien speichern, dann die DB-Zeile im Status „entwurf“. Beim ersten Foto entsteht der
// Entwurf des Nutzers. Erst Dateien, dann DB: Eine Datei ohne Zeile räumt das Aufräumen nach
// 24 Stunden weg, eine Zeile ohne Datei gäbe es nie.
import 'server-only'
import { randomUUID } from 'node:crypto'
import { MAX_UPLOAD_BYTES, type PhotoRejection } from '@/server/storage/photo-processor'
import type { PhotoRole } from '@/shared/config/constants'
import { readLimitedBody } from '@/shared/lib/read-limited-body'
import { err, ok, type Result } from '@/shared/lib/result'
import { insertDraftPhoto } from '../data/photo-repository'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'
import { resolveOwnDraftId } from './own-draft'
import { deletePhotoFiles, photoKeysFor } from './photo-files'

export interface UploadPhotoInput {
  actor: CaptureActor
  role: PhotoRole
  /** Entwurf, zu dem das Foto gehört. null: der neueste des Nutzers, sonst ein neuer. */
  draftId: string | null
  /** Rohe Bilddaten aus der Anfrage. Gelesen wird höchstens bis zur Grenze. */
  body: ReadableStream<Uint8Array> | null
}

export interface UploadedPhoto {
  photoId: string
  draftId: string
}

export type UploadPhotoError = PhotoRejection | { kind: 'draft-not-found' }

type Database = CaptureDeps['db']

interface PhotoRow {
  input: UploadPhotoInput
  photoId: string
  path: string
  mimeType: string
}

/** Entwurf finden oder anlegen und die Fotozeile schreiben, in einer Transaktion. */
function insertRow(db: Database, row: PhotoRow): Promise<string | null> {
  const { actor, role } = row.input
  return db.transaction(async (tx) => {
    const draftId = await resolveOwnDraftId(tx, actor, row.input.draftId)
    if (draftId === null) return null
    const { photoId: id, path, mimeType } = row
    await insertDraftPhoto(tx, { id, ...actor, draftId, role, path, mimeType })
    return draftId
  })
}

export async function uploadPhoto(
  deps: CaptureDeps,
  input: UploadPhotoInput,
): Promise<Result<UploadedPhoto, UploadPhotoError>> {
  const upload = await readLimitedBody(input.body, MAX_UPLOAD_BYTES)
  if (upload === null) return err({ kind: 'too-large', maxBytes: MAX_UPLOAD_BYTES })
  const processed = await deps.processor.process(upload)
  if (!processed.ok) return processed
  const { full, thumbnail } = processed.value
  const photoId = randomUUID()
  const keys = photoKeysFor({ householdId: input.actor.householdId, photoId })
  await deps.storage.save(keys.full, full)
  await deps.storage.save(keys.thumbnail, thumbnail)
  const row = { input, photoId, path: keys.full, mimeType: full.mimeType }
  const draftId = await insertRow(deps.db, row).catch(async (error: unknown) => {
    await deletePhotoFiles(deps.storage, keys)
    throw error
  })
  if (draftId !== null) return ok({ photoId, draftId })
  await deletePhotoFiles(deps.storage, keys)
  return err({ kind: 'draft-not-found' })
}
