// Datenbank für die E2E-Tests mit Beispielvorrat (playwright.beispiel.config.ts). Läuft, bevor der
// Server die PGlite-Datei öffnet: Migrationen, Stammdaten, Beispielhaushalt mit erfundener Quelle
// und ein zweiter Haushalt ohne Vorrat. Beide bekommen ein Passwort-Konto zum Anmelden.
// Aufruf über den webServer der Konfiguration, DATABASE_URL kommt von dort.
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import {
  buildGoal,
  buildHousehold,
  buildHouseholdSettings,
  buildUser,
} from '../../../db/seeds/factories'
import { seedDemo } from '../../../db/seeds/demo'
import { seedDemoSource } from '../../../db/seeds/demo-source'
import { seedMasterData } from '../../../db/seeds/master-data'
import { CREDENTIAL_PROVIDER } from '../../../src/features/auth/data/credential'
import { connectDatabase } from '../../../src/server/db/client'
import type { Database } from '../../../src/server/db/connection'
import { accounts, users } from '../../../src/server/db/schema/account'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import { goals } from '../../../src/server/db/schema/recommendation'
import { loadEnv } from '../../../src/shared/config/env'
import { E2E_DEMO_ADMIN, E2E_EMPTY_ADMIN } from '../../helpers/e2e-demo-users'

type Credentials = Readonly<{ username: string; password: string }>

async function addPassword(db: Database, userId: string, { password }: Credentials) {
  await db.insert(accounts).values({
    accountId: userId,
    providerId: CREDENTIAL_PROVIDER,
    userId,
    password: await hashPassword(password),
  })
}

async function seedDemoHousehold(db: Database) {
  await seedDemo(db, new Date())
  const [household] = await db.select({ id: households.id }).from(households)
  if (household === undefined) throw new Error('Beispielhaushalt fehlt')
  await seedDemoSource(db, household.id)
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, E2E_DEMO_ADMIN.username))
  if (admin === undefined) throw new Error('Admin des Beispielhaushalts fehlt')
  await addPassword(db, admin.id, E2E_DEMO_ADMIN)
}

// Wie nach der Ersteinrichtung: Haushalt mit Ziel, ohne Mitglieder, ohne Vorrat.
async function seedEmptyHousehold(db: Database) {
  const household = buildHousehold({ name: 'Unser Haushalt' })
  await db.insert(households).values(household)
  await db.insert(householdSettings).values(buildHouseholdSettings({ householdId: household.id }))
  await db.insert(goals).values(buildGoal({ householdId: household.id }))
  const user = buildUser({
    householdId: household.id,
    name: 'Neu Beispiel',
    username: E2E_EMPTY_ADMIN.username,
    role: 'admin',
  })
  await db.insert(users).values(user)
  await addPassword(db, user.id, E2E_EMPTY_ADMIN)
}

const connection = await connectDatabase(loadEnv().DATABASE_URL)
try {
  await connection.migrate()
  await seedMasterData(connection.db)
  await seedDemoHousehold(connection.db)
  await seedEmptyHousehold(connection.db)
} finally {
  await connection.close()
}
