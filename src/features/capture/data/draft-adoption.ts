// Bestätigen aus dem Entwurf (#66, technik.html „Bestätigen“): Läuft in der Transaktion des
// Speicherns. Erst die Fotos fest machen, dann den Entwurf löschen. Umgekehrt leerte
// `ON DELETE SET NULL` den Verweis, und die Fotos wären nicht mehr zu finden.
import 'server-only'
import { and, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { photos } from '@/server/db/schema/capture'
import type { DraftAdoption } from '../domain/stock-records'
import { deleteOwnDraft, findDraft, lockDraftOwner } from './draft-repository'

/**
 * Dieselbe Sperre wie Upload und Verwerfen: Ein gleichzeitig hochgeladenes Foto landet ganz vor
 * dem Bestätigen (und wird fest) oder danach in einem neuen Entwurf, nie ohne Entwurf.
 */
export async function adoptDraft(tx: Database, adoption: DraftAdoption): Promise<void> {
  const { householdId, userId, draftId, productId } = adoption
  await lockDraftOwner(tx, { householdId, userId })
  if ((await findDraft(tx, { householdId, userId }, draftId)) === null) return
  await tx
    .update(photos)
    .set({ status: 'fest', productId })
    .where(
      and(
        eq(photos.draftId, draftId),
        eq(photos.householdId, householdId),
        eq(photos.status, 'entwurf'),
      ),
    )
  await deleteOwnDraft(tx, { householdId, userId }, draftId)
}
