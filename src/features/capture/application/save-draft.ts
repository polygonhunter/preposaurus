// Entwurf sichern (UMSETZUNG M6-03): bei jedem Schrittwechsel der ganze Stand der Maske. Gilt
// auch für die manuelle Erfassung, die ohne Foto noch keinen Entwurf hat. Ein Entwurf ist nur
// ein Vorschlag und zählt nirgends mit (kein Produkt, keine Einheit).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { updateDraftData } from '../data/draft-repository'
import type { CaptureDraftData } from '../schemas'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'
import { resolveOwnDraftId } from './own-draft'

interface SaveDraftInput {
  actor: CaptureActor
  /** null: der neueste Entwurf des Nutzers, sonst ein neuer */
  draftId: string | null
  data: CaptureDraftData
}

export async function saveDraft(
  deps: Pick<CaptureDeps, 'db'>,
  { actor, draftId, data }: SaveDraftInput,
): Promise<Result<{ draftId: string }, { kind: 'not-found' }>> {
  const savedId = await deps.db.transaction(async (tx) => {
    const id = await resolveOwnDraftId(tx, actor, draftId)
    if (id !== null) await updateDraftData(tx, id, data)
    return id
  })
  return savedId === null ? err({ kind: 'not-found' }) : ok({ draftId: savedId })
}
