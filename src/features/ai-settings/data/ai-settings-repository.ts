// KI-Verbindungen, Rollen-Zuweisungen und Haushaltsschalter (#108). Jede Abfrage ist auf den
// Haushalt gefiltert (CODE_PRINZIPIEN §8). Der Schlüssel kommt nur als Chiffrat herein und heraus.
import 'server-only'
import { and, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { aiConnections, aiRoleAssignments } from '@/server/db/schema/ai-connections'
import { householdSettings } from '@/server/db/schema/household'
import type { AI_CONNECTION_STATUSES, AI_PROVIDERS } from '@/shared/config/constants'
import type { RoleAssignment } from '../domain/resolve-role'

interface EncryptedKey {
  ciphertext: string
  iv: string
  authTag: string
  hint: string
  version: number
}

export interface StoredConnection {
  id: string
  provider: (typeof AI_PROVIDERS)[number]
  name: string
  baseUrl: string | null
  isActive: boolean
  key: EncryptedKey | null
  /** Ergebnis von „Verbindung testen“, null, solange nie getestet wurde */
  lastTest: { status: ConnectionTestStatus; testedAt: Date } | null
}

export interface HouseholdAiSettings {
  isAiEnabled: boolean
  connections: StoredConnection[]
  assignments: RoleAssignment[]
}

export type ConnectionTestStatus = (typeof AI_CONNECTION_STATUSES)[number]

type ConnectionRow = typeof aiConnections.$inferSelect

// Der CHECK in der DB garantiert: alle fünf Schlüsselspalten oder keine.
function toEncryptedKey(row: ConnectionRow): EncryptedKey | null {
  const { apiKeyCiphertext, apiKeyIv, apiKeyAuthTag, apiKeyHint, apiKeyVersion } = row
  if (apiKeyCiphertext === null || apiKeyIv === null || apiKeyAuthTag === null) return null
  if (apiKeyHint === null || apiKeyVersion === null) return null
  const key = { ciphertext: apiKeyCiphertext, iv: apiKeyIv, authTag: apiKeyAuthTag }
  return { ...key, hint: apiKeyHint, version: apiKeyVersion }
}

// Der CHECK in der DB garantiert: Status und Zeitpunkt gibt es nur zusammen.
function toLastTest({ lastTestStatus, lastTestedAt }: ConnectionRow): StoredConnection['lastTest'] {
  if (lastTestStatus === null || lastTestedAt === null) return null
  return { status: lastTestStatus, testedAt: lastTestedAt }
}

function toStoredConnection(row: ConnectionRow): StoredConnection {
  const { id, provider, name, baseUrl, isActive } = row
  const key = toEncryptedKey(row)
  return { id, provider, name, baseUrl, isActive, key, lastTest: toLastTest(row) }
}

async function readIsAiEnabled(db: Database, householdId: string): Promise<boolean> {
  const [settings] = await db
    .select({ isAiEnabled: householdSettings.isAiEnabled })
    .from(householdSettings)
    .where(eq(householdSettings.householdId, householdId))
  return settings?.isAiEnabled ?? false
}

export async function loadHouseholdAiSettings(
  db: Database,
  householdId: string,
): Promise<HouseholdAiSettings> {
  const [isAiEnabled, connections, assignments] = await Promise.all([
    readIsAiEnabled(db, householdId),
    db
      .select()
      .from(aiConnections)
      .where(eq(aiConnections.householdId, householdId))
      .orderBy(aiConnections.createdAt),
    db
      .select({
        role: aiRoleAssignments.role,
        connectionId: aiRoleAssignments.connectionId,
        model: aiRoleAssignments.model,
        isActive: aiRoleAssignments.isActive,
      })
      .from(aiRoleAssignments)
      .where(eq(aiRoleAssignments.householdId, householdId)),
  ])
  return { isAiEnabled, connections: connections.map(toStoredConnection), assignments }
}

export async function findConnection(
  db: Database,
  householdId: string,
  connectionId: string,
): Promise<StoredConnection | null> {
  const [row] = await db
    .select()
    .from(aiConnections)
    .where(and(eq(aiConnections.householdId, householdId), eq(aiConnections.id, connectionId)))
  return row === undefined ? null : toStoredConnection(row)
}

export interface NewConnection {
  id: string
  householdId: string
  provider: (typeof AI_PROVIDERS)[number]
  name: string
  key: EncryptedKey
}

export async function insertConnection(db: Database, connection: NewConnection): Promise<void> {
  const { key, ...rest } = connection
  await db.insert(aiConnections).values({
    ...rest,
    apiKeyCiphertext: key.ciphertext,
    apiKeyIv: key.iv,
    apiKeyAuthTag: key.authTag,
    apiKeyHint: key.hint,
    apiKeyVersion: key.version,
  })
}

export interface TestResult {
  householdId: string
  connectionId: string
  status: ConnectionTestStatus
  testedAt: Date
}

export async function saveTestResult(db: Database, result: TestResult): Promise<void> {
  await db
    .update(aiConnections)
    .set({ lastTestStatus: result.status, lastTestedAt: result.testedAt })
    .where(
      and(
        eq(aiConnections.householdId, result.householdId),
        eq(aiConnections.id, result.connectionId),
      ),
    )
}
