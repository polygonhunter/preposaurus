// Beispielvorrat für die E2E-Tests (POST /api/e2e/beispielvorrat, nur mit E2E_DEMO_STOCK). Jeder
// E2E-Lauf startet leer und wird über die Oberfläche eingerichtet. Danach legt diese Funktion im
// laufenden Server Personen, Lagerorte und Vorrat in den neuen Haushalt. Ein zweiter Prozess darf
// die PGlite-Datei nicht öffnen, solange der Server läuft, deshalb geht es nicht per Skript.
// Dazu die erfundene Beispielquelle und ein Zieldatum, damit die Übersicht Tage und die Zielzeile
// zeigt (#67 bis #70), und ein Login mit der Rolle Mitglied (Sam), damit die Tests die Sicht eines
// Mitglieds prüfen können (#37). Das Passwort ist erfunden und gilt nur in der Wegwerf-Datenbank
// der Tests.
import { and, eq, isNull } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { getDb } from '../../src/server/db/get-db'
import { accounts, users } from '../../src/server/db/schema/account'
import { members } from '../../src/server/db/schema/household'
import { goals } from '../../src/server/db/schema/recommendation'
import { seedDemoIntoHousehold } from './demo'
import { E2E_MEMBER_LOGIN } from './demo-data'
import { seedDemoSource } from './demo-source'
import { buildUser, daysFrom } from './factories'

// Wie im Beispielhaushalt (db/seeds/demo.ts): Zieldatum in 40 Tagen
const GOAL_HORIZON_DAYS = 40

type E2eTarget = Readonly<{
  householdId: string
  userId: string
  hashPassword: (password: string) => Promise<string>
}>

async function setGoalDateIfMissing(db: Database, householdId: string, today: Date) {
  await db
    .update(goals)
    .set({ targetDate: daysFrom(today, GOAL_HORIZON_DAYS) })
    .where(and(eq(goals.householdId, householdId), isNull(goals.targetDate)))
}

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
  const today = new Date()
  const { householdId, userId } = target
  const created = await seedDemoIntoHousehold(db, { householdId, userId, today })
  if (!created) return false
  await seedDemoSource(db, householdId)
  await setGoalDateIfMissing(db, householdId, today)
  await insertMemberLogin(db, target)
  return true
}
