'use server'
// Entwurf verwerfen (UMSETZUNG M6-03): „Verwerfen“ beim Öffnen von „Neu“ oder „Abbrechen“ in der
// Maske. Erst DB, dann Dateien. Übrig gebliebene Dateien landen im Protokoll, nicht in der Maske.
import { loadEnv } from '@/shared/config/env'
import { createLogger } from '@/shared/lib/logger'
import { requireCaptureActor } from '../application/capture-actor'
import { loadCaptureDeps } from '../application/capture-deps'
import { discardDraft, type DiscardedDraft } from '../application/discard-draft'
import { discardDraftInputSchema } from '../schemas'
import { accessMessage, DRAFT_GONE, failure, type DraftActionState } from './action-messages'

export type DiscardDraftState = DraftActionState<{ removedPhotos: number }>

function logLeftovers({ leftoverPhotoIds }: DiscardedDraft): void {
  if (leftoverPhotoIds.length === 0) return
  createLogger({ level: loadEnv().LOG_LEVEL }).warn(
    'Fotodateien eines verworfenen Entwurfs blieben liegen, das Aufräumen entfernt sie später',
    { photoIds: leftoverPhotoIds },
  )
}

export async function discardDraftAction(input: unknown): Promise<DiscardDraftState> {
  const actor = await requireCaptureActor()
  if (!actor.ok) return failure(accessMessage(actor.error))
  const parsed = discardDraftInputSchema.safeParse(input)
  if (!parsed.success) return failure(DRAFT_GONE)
  const result = await discardDraft(await loadCaptureDeps(), {
    actor: actor.value,
    draftId: parsed.data.entwurfId,
  })
  if (!result.ok) return failure(DRAFT_GONE)
  logLeftovers(result.value)
  return { ok: true, removedPhotos: result.value.removedPhotos }
}
