// Beispielvorrat für die E2E-Tests (POST /api/e2e/beispielvorrat, nur mit E2E_DEMO_STOCK). Jeder
// E2E-Lauf startet leer und wird über die Oberfläche eingerichtet. Danach legt diese Funktion im
// laufenden Server Personen, Lagerorte und Vorrat in den neuen Haushalt. Ein zweiter Prozess darf
// die PGlite-Datei nicht öffnen, solange der Server läuft, deshalb geht es nicht per Skript.
// Dazu kommt ein Login mit der Rolle Mitglied (Sam), damit die Tests die Sicht eines Mitglieds
// prüfen können (#37). Das Passwort ist erfunden und gilt nur in der Wegwerf-Datenbank der Tests.
import { and, eq } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { getDb } from '../../src/server/db/get-db'
import { accounts, users } from '../../src/server/db/schema/account'
import { members } from '../../src/server/db/schema/household'
import { seedDemoIntoHousehold } from './demo'
import { E2E_MEMBER_LOGIN } from './demo-data'
import { buildUser } from './factories'

type E2eTarget = Readonly<{
  householdId: string
  userId: string
  hashPassword: (password: string) => Promise<string>
}>

async function insertMemberLogin(db: Database, target: E2eTarget) {
  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(eq(members.householdId, target.householdId), eq(members.name, E2E_MEMBER_LOGIN.name)),
    )
  const user = buildUser({
    householdId: target.householdId,
    name: E2E_MEMBER_LOGIN.name,
    username: E2E_MEMBER_LOGIN.username,
    role: 'mitglied',
    memberId: member?.id ?? null,
  })
  await db.insert(users).values(user)
  await db.insert(accounts).values({
    accountId: user.id,
    providerId: 'credential',
    userId: user.id,
    password: await target.hashPassword(E2E_MEMBER_LOGIN.password),
  })
}

export async function seedDemoForE2e(target: E2eTarget): Promise<boolean> {
  const db = await getDb()
  const isCreated = await seedDemoIntoHousehold(db, {
    householdId: target.householdId,
    userId: target.userId,
    today: new Date(),
  })
  if (isCreated) await insertMemberLogin(db, target)
  return isCreated
}
