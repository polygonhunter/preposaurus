// Welcher Entwurf gemeint ist, für Foto-Upload und Sichern gleich: ein genannter muss dem Nutzer
// gehören, ohne Angabe gilt sein neuester, und fehlt der, entsteht einer. Läuft in der Transaktion
// des Aufrufers, die Sperre auf die Nutzerzeile verhindert einen zweiten Entwurf bei Parallelität.
import 'server-only'
import { findDraft, insertDraft, lockDraftOwner } from '../data/draft-repository'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'

type Database = CaptureDeps['db']

/** ID des Entwurfs, oder null, wenn der genannte nicht (mehr) dem Nutzer gehört. */
export async function resolveOwnDraftId(
  tx: Database,
  actor: CaptureActor,
  draftId: string | null,
): Promise<string | null> {
  await lockDraftOwner(tx, actor)
  const draft = await findDraft(tx, actor, draftId)
  if (draft !== null) return draft.id
  return draftId === null ? insertDraft(tx, actor) : null
}
