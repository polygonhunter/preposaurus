// Aufräumen der Erfassung (#66, technik.html „Aufräumen“). Ein Job des Workers über alle
// Haushalte, deshalb ausnahmsweise ohne Filter auf haushalt_id: Er zeigt nichts an und löscht nur,
// was niemandem mehr dient (alte Entwürfe, Entwurfsfotos ohne Entwurf).
import 'server-only'
import { and, eq, exists, gte, inArray, isNull, lt, not, or } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { captureDrafts, photos } from '@/server/db/schema/capture'

export interface StalePhoto {
  id: string
  householdId: string
}

/**
 * Ein Entwurf gilt als alt, wenn weder er noch eines seiner Fotos seit `before` angefasst wurde.
 * Der Upload ändert den Entwurf selbst nicht, deshalb zählt auch das jüngste Foto.
 */
const hasRecentPhoto = (tx: Database, before: Date) =>
  exists(
    tx
      .select({ id: photos.id })
      .from(photos)
      .where(and(eq(photos.draftId, captureDrafts.id), gte(photos.createdAt, before))),
  )

async function staleDraftIds(tx: Database, before: Date): Promise<string[]> {
  const rows = await tx
    .select({ id: captureDrafts.id })
    .from(captureDrafts)
    .where(and(lt(captureDrafts.updatedAt, before), not(hasRecentPhoto(tx, before))))
  return rows.map((row) => row.id)
}

/** Entwurfsfotos alter Entwürfe und solche ohne Entwurf (sollte es nicht geben, aber falls doch). */
function stalePhotoFilter(draftIds: readonly string[]) {
  const withoutDraft = isNull(photos.draftId)
  const ofStaleDraft = draftIds.length === 0 ? undefined : inArray(photos.draftId, [...draftIds])
  return and(eq(photos.status, 'entwurf'), or(withoutDraft, ofStaleDraft))
}

/**
 * Löscht alte Entwürfe samt ihren Entwurfsfotos in einer Transaktion und liefert die Fotos, deren
 * Dateien danach weg müssen. Erst die Fotos, sonst leerte `ON DELETE SET NULL` ihren Verweis.
 */
export function deleteStaleDrafts(db: Database, before: Date) {
  return db.transaction(async (tx) => {
    const draftIds = await staleDraftIds(tx, before)
    const removed: StalePhoto[] = await tx
      .delete(photos)
      .where(stalePhotoFilter(draftIds))
      .returning({ id: photos.id, householdId: photos.householdId })
    if (draftIds.length > 0) {
      await tx.delete(captureDrafts).where(inArray(captureDrafts.id, draftIds))
    }
    return { draftCount: draftIds.length, photos: removed }
  })
}

/** Alle Fotos mit Haushalt, um ihre beiden Dateien (Bild und Vorschau) als belegt zu zählen. */
export function listAllPhotos(db: Database): Promise<StalePhoto[]> {
  return db.select({ id: photos.id, householdId: photos.householdId }).from(photos)
}
