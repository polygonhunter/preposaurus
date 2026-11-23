'use server'
// Entwurf sichern bei jedem Schrittwechsel (UMSETZUNG M6-03). Aufruf aus der Maske mit
// `{ entwurfId?, daten }`. Die Antwort enthält die ID, die beim nächsten Sichern mitkommt.
import { requireCaptureActor } from '../application/capture-actor'
import { loadCaptureDeps } from '../application/capture-deps'
import { saveDraft } from '../application/save-draft'
import { saveDraftInputSchema } from '../schemas/draft'
import { accessMessage, DRAFT_GONE, failure, type DraftActionState } from './action-messages'

export type SaveDraftState = DraftActionState<{ draftId: string }>

const INVALID = 'Der Stand ließ sich nicht sichern. Bitte prüft die Eingaben.'

export async function saveDraftAction(input: unknown): Promise<SaveDraftState> {
  const actor = await requireCaptureActor()
  if (!actor.ok) return failure(accessMessage(actor.error))
  const parsed = saveDraftInputSchema.safeParse(input)
  if (!parsed.success) return failure(INVALID)
  const result = await saveDraft(await loadCaptureDeps(), {
    actor: actor.value,
    draftId: parsed.data.entwurfId ?? null,
    data: parsed.data.daten,
  })
  return result.ok ? { ok: true, draftId: result.value.draftId } : failure(DRAFT_GONE)
}
