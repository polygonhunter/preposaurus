// Haushalt mit Einstellungen für die Tests der KI-Einstellungen (#108). Schlüssel sind erfunden.
import { buildHousehold, buildHouseholdSettings } from '../../../db/seeds/factories'
import type { Database } from '../../../src/server/db/connection'
import { aiRoleAssignments } from '../../../src/server/db/schema/ai-connections'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import type { AiRole } from '../../../src/shared/config/ai-roles'

export const APP_SECRET = 's'.repeat(32)
export const PLAINTEXT_KEY = 'sk-ant-test-nur-fuer-tests-4f2a'

export const envWith = (overrides: { ANTHROPIC_API_KEY?: string; APP_SECRET?: string } = {}) => ({
  APP_SECRET,
  AI_PROVIDER: 'anthropic' as const,
  ANTHROPIC_API_KEY: undefined,
  ...overrides,
})

export async function insertHousehold(db: Database, isAiEnabled = true): Promise<string> {
  const household = buildHousehold()
  await db.insert(households).values(household)
  await db
    .insert(householdSettings)
    .values(buildHouseholdSettings({ householdId: household.id, isAiEnabled }))
  return household.id
}

interface AssignmentInput {
  householdId: string
  role: AiRole
  connectionId: string
  model?: string
  isActive?: boolean
}

export async function assignRole(db: Database, input: AssignmentInput): Promise<void> {
  await db.insert(aiRoleAssignments).values({ model: 'claude-haiku-5-5', ...input })
}
