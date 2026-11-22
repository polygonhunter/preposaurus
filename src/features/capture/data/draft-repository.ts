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

export interface StoredDraft {
  id: string
  /** Rohes JSON aus `daten`, geprüft wird im Use-Case */
  data: unknown
  updatedAt: Date
}

/** Ein bestimmter oder der neueste Entwurf des Nutzers, oder null. */
export async function findDraft(
  db: Database,
  owner: DraftOwner,
  draftId: string | null,
): Promise<StoredDraft | null> {
  const byId = draftId === null ? undefined : eq(captureDrafts.id, draftId)
  const [row] = await db
    .select({ id: captureDrafts.id, data: captureDrafts.data, updatedAt: captureDrafts.updatedAt })
    .from(captureDrafts)
    .where(and(ownedBy(owner), byId))
    .orderBy(desc(captureDrafts.createdAt))
    .limit(1)
  return row ?? null
}

export async function updateDraftData(db: Database, draftId: string, data: unknown): Promise<void> {
  await db.update(captureDrafts).set({ data }).where(eq(captureDrafts.id, draftId))
}

/** Löscht den Entwurf, aber nur, wenn er dem Nutzer gehört. */
export async function deleteOwnDraft(
  db: Database,
  owner: DraftOwner,
  draftId: string,
): Promise<void> {
  await db.delete(captureDrafts).where(and(eq(captureDrafts.id, draftId), ownedBy(owner)))
}

export async function insertDraft(db: Database, owner: DraftOwner): Promise<string> {
  const [row] = await db
    .insert(captureDrafts)
    .values({ householdId: owner.householdId, userId: owner.userId })
    .returning({ id: captureDrafts.id })
  if (row === undefined) throw new Error('Entwurf wurde nicht angelegt')
  return row.id
}
