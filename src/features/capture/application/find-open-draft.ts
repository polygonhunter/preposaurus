// Offener Entwurf beim Öffnen von „Neu“ (UMSETZUNG M6-03): Gibt es einen, fragt die App
// „Erfassung fortsetzen oder verwerfen?“. Nur der eigene Entwurf, nie einer aus dem Haushalt.
import 'server-only'
import type { PhotoRole } from '@/shared/config/constants'
import { findDraft } from '../data/draft-repository'
import { listDraftPhotos } from '../data/photo-repository'
import { captureDraftDataSchema, type CaptureDraftData } from '../schemas/draft'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'

export interface OpenDraft {
  draftId: string
  data: CaptureDraftData
  /** Hochgeladene Fotos in Aufnahmereihenfolge, ausgeliefert über /api/photos/[id] */
  photos: { id: string; role: PhotoRole }[]
  updatedAt: Date
}

/**
 * Passt der gespeicherte Stand nicht mehr zum Schema (z. B. nach einem Update), beginnt die
 * Maske leer. Die Fotos bleiben erhalten, nichts wird erfunden.
 */
function readDraftData(raw: unknown): CaptureDraftData {
  const parsed = captureDraftDataSchema.safeParse(raw)
  return parsed.success ? parsed.data : {}
}

export async function findOpenDraft(
  deps: Pick<CaptureDeps, 'db'>,
  actor: CaptureActor,
): Promise<OpenDraft | null> {
  const draft = await findDraft(deps.db, actor, null)
  if (draft === null) return null
  const photos = await listDraftPhotos(deps.db, draft.id)
  return {
    draftId: draft.id,
    data: readDraftData(draft.data),
    photos: photos.map(({ id, role }) => ({ id, role })),
    updatedAt: draft.updatedAt,
  }
}
