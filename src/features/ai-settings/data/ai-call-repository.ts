// Protokoll ki_aufruf: eine Zeile je KI-Aufruf, auch bei Fehlschlägen. Für die Kostenübersicht und
// den PoC (Fehlerquote je Rolle, #114). Nie mit Schlüssel oder Bildinhalt.
import 'server-only'
import { and, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { aiCalls, photos } from '@/server/db/schema/capture'

export type AiCallRow = Pick<
  typeof aiCalls.$inferInsert,
  | 'householdId'
  | 'photoId'
  | 'role'
  | 'connectionId'
  | 'attempt'
  | 'confidence'
  | 'model'
  | 'inputTokens'
  | 'outputTokens'
  | 'durationMs'
  | 'isSuccess'
  | 'errorKind'
> & { costUsd: number | null }

export async function insertAiCall(db: Database, row: AiCallRow): Promise<void> {
  // numeric kommt bei Drizzle als Text, damit keine Stelle verloren geht.
  const costUsd = row.costUsd === null ? null : row.costUsd.toFixed(6)
  await db.insert(aiCalls).values({ ...row, costUsd })
}

/**
 * Mandantenbezug eines KI-Aufrufs (#133): Das Foto gehört demselben Haushalt. Die Verbindung
 * prüft schon der zusammengesetzte Fremdschlüssel der Rollen-Zuweisung (verbindung_id, haushalt_id).
 */
export async function isPhotoOfHousehold(
  db: Database,
  { householdId, photoId }: { householdId: string; photoId: string },
): Promise<boolean> {
  const [row] = await db
    .select({ id: photos.id })
    .from(photos)
    .where(and(eq(photos.id, photoId), eq(photos.householdId, householdId)))
    .limit(1)
  return row !== undefined
}
