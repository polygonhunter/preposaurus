// Entwürfe der Foto-Erfassung (technik.html „Wann wird gespeichert“). Ein Entwurf gehört genau
// einem Nutzer. Jede Abfrage filtert auf Haushalt UND Nutzer, ein fremder Entwurf ist „nicht da“.
import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { users } from '@/server/db/schema/account'
import { captureDrafts } from '@/server/db/schema/capture'

export interface DraftOwner {
  householdId: string
  userId: string
}

const ownedBy = (owner: DraftOwner) =>
  and(eq(captureDrafts.householdId, owner.householdId), eq(captureDrafts.userId, owner.userId))

/**
 * Sperrt die Nutzerzeile bis zum Ende der Transaktion. So legen zwei gleichzeitige erste Fotos
 * (schnelle MHD-Serie) nicht zwei Entwürfe an. Ohne Migration, auf PGlite und PostgreSQL gleich.
 */
export async function lockDraftOwner(tx: Database, owner: DraftOwner): Promise<void> {
  await tx.select({ id: users.id }).from(users).where(eq(users.id, owner.userId)).for('update')
}

/** Neuester Entwurf des Nutzers, oder null. */
export async function findLatestDraftId(db: Database, owner: DraftOwner): Promise<string | null> {
  const [row] = await db
    .select({ id: captureDrafts.id })
    .from(captureDrafts)
    .where(ownedBy(owner))
    .orderBy(desc(captureDrafts.createdAt))
    .limit(1)
  return row?.id ?? null
}

/** true, wenn der Entwurf existiert und dem Nutzer gehört. */
export async function isOwnDraft(
  db: Database,
  owner: DraftOwner,
  draftId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: captureDrafts.id })
    .from(captureDrafts)
    .where(and(eq(captureDrafts.id, draftId), ownedBy(owner)))
  return row !== undefined
}

export async function insertDraft(db: Database, owner: DraftOwner): Promise<string> {
  const [row] = await db
    .insert(captureDrafts)
    .values({ householdId: owner.householdId, userId: owner.userId })
    .returning({ id: captureDrafts.id })
  if (row === undefined) throw new Error('Entwurf wurde nicht angelegt')
  return row.id
}
