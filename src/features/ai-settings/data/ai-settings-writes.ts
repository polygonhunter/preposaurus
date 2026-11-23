// Änderungen aus der Einstellungsseite „Foto-Erkennung“ (#108, #79): Haushaltsschalter, Schlüssel
// ersetzen, Verbindung entfernen und Zuweisungen je Rolle. Jede Abfrage ist auf den Haushalt
// gefiltert (CODE_PRINZIPIEN §8). Der Schlüssel kommt nur als Chiffrat herein.
import 'server-only'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { aiConnections, aiRoleAssignments } from '@/server/db/schema/ai-connections'
import { householdSettings } from '@/server/db/schema/household'
import type { RoleAssignment } from '../domain/resolve-role'
import type { NewConnection } from './ai-settings-repository'

type EncryptedKey = NewConnection['key']

const ofHousehold = (householdId: string, connectionId: string) =>
  and(eq(aiConnections.householdId, householdId), eq(aiConnections.id, connectionId))

export async function saveAiEnabled(
  db: Database,
  change: Readonly<{ householdId: string; isEnabled: boolean }>,
): Promise<void> {
  const { householdId, isEnabled } = change
  await db
    .insert(householdSettings)
    .values({ householdId, isAiEnabled: isEnabled })
    .onConflictDoUpdate({ target: householdSettings.householdId, set: { isAiEnabled: isEnabled } })
}

export async function hasConnectionNamed(
  db: Database,
  householdId: string,
  name: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: aiConnections.id })
    .from(aiConnections)
    .where(
      and(
        eq(aiConnections.householdId, householdId),
        sql`lower(${aiConnections.name}) = lower(${name})`,
      ),
    )
  return row !== undefined
}

/** Neuer Schlüssel für eine Verbindung. Der alte Teststatus gilt dann nicht mehr. */
export async function replaceConnectionKey(
  db: Database,
  change: Readonly<{ householdId: string; connectionId: string; key: EncryptedKey }>,
): Promise<boolean> {
  const { key } = change
  const rows = await db
    .update(aiConnections)
    .set({
      apiKeyCiphertext: key.ciphertext,
      apiKeyIv: key.iv,
      apiKeyAuthTag: key.authTag,
      apiKeyHint: key.hint,
      apiKeyVersion: key.version,
      lastTestStatus: null,
      lastTestedAt: null,
    })
    .where(ofHousehold(change.householdId, change.connectionId))
    .returning({ id: aiConnections.id })
  return rows.length > 0
}

// Eine zugewiesene Verbindung lässt sich nicht löschen (Fremdschlüssel NO ACTION). Ihre Rollen
// wandern deshalb zu einer anderen Verbindung mit Schlüssel, sonst verlieren sie die Zuweisung und
// gelten als „nicht eingerichtet“.
async function releaseRoles(tx: Database, householdId: string, connectionId: string) {
  const [other] = await tx
    .select({ id: aiConnections.id })
    .from(aiConnections)
    .where(
      and(
        eq(aiConnections.householdId, householdId),
        ne(aiConnections.id, connectionId),
        eq(aiConnections.isActive, true),
        sql`${aiConnections.apiKeyCiphertext} is not null`,
      ),
    )
    .orderBy(aiConnections.createdAt)
    .limit(1)
  const assigned = and(
    eq(aiRoleAssignments.householdId, householdId),
    eq(aiRoleAssignments.connectionId, connectionId),
  )
  if (other === undefined) await tx.delete(aiRoleAssignments).where(assigned)
  else await tx.update(aiRoleAssignments).set({ connectionId: other.id }).where(assigned)
}

export async function deleteConnection(
  db: Database,
  target: Readonly<{ householdId: string; connectionId: string }>,
): Promise<boolean> {
  const { householdId, connectionId } = target
  return db.transaction(async (tx) => {
    await releaseRoles(tx, householdId, connectionId)
    const rows = await tx
      .delete(aiConnections)
      .where(ofHousehold(householdId, connectionId))
      .returning({ id: aiConnections.id })
    return rows.length > 0
  })
}

/** Legt fehlende Zuweisungen an, vorhandene bleiben, wie sie sind. */
export async function insertMissingAssignments(
  db: Database,
  householdId: string,
  assignments: readonly RoleAssignment[],
): Promise<void> {
  if (assignments.length === 0) return
  await db
    .insert(aiRoleAssignments)
    .values(assignments.map((assignment) => ({ householdId, ...assignment })))
    .onConflictDoNothing({ target: [aiRoleAssignments.householdId, aiRoleAssignments.role] })
}

export async function saveAssignments(
  db: Database,
  householdId: string,
  assignments: readonly RoleAssignment[],
): Promise<void> {
  if (assignments.length === 0) return
  await db
    .insert(aiRoleAssignments)
    .values(assignments.map((assignment) => ({ householdId, ...assignment })))
    .onConflictDoUpdate({
      target: [aiRoleAssignments.householdId, aiRoleAssignments.role],
      set: {
        connectionId: sql`excluded.verbindung_id`,
        model: sql`excluded.modell`,
        isActive: sql`excluded.aktiv`,
        updatedAt: sql`now()`,
      },
    })
}
