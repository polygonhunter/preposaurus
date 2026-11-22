// Beispielvorrat für die E2E-Tests (POST /api/e2e/beispielvorrat, nur mit E2E_DEMO_STOCK). Jeder
// E2E-Lauf startet leer und wird über die Oberfläche eingerichtet. Danach legt diese Funktion im
// laufenden Server Personen, Lagerorte und Vorrat in den neuen Haushalt. Ein zweiter Prozess darf
// die PGlite-Datei nicht öffnen, solange der Server läuft, deshalb geht es nicht per Skript.
// Dazu die erfundene Beispielquelle und ein Zieldatum, damit die Übersicht Tage und die Zielzeile
// zeigt (#67 bis #70).
import { and, eq, isNull } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { getDb } from '../../src/server/db/get-db'
import { goals } from '../../src/server/db/schema/recommendation'
import { seedDemoIntoHousehold } from './demo'
import { seedDemoSource } from './demo-source'
import { daysFrom } from './factories'

// Wie im Beispielhaushalt (db/seeds/demo.ts): Zieldatum in 40 Tagen
const GOAL_HORIZON_DAYS = 40

async function setGoalDateIfMissing(db: Database, householdId: string, today: Date) {
  await db
    .update(goals)
    .set({ targetDate: daysFrom(today, GOAL_HORIZON_DAYS) })
    .where(and(eq(goals.householdId, householdId), isNull(goals.targetDate)))
}

export async function seedDemoForE2e(householdId: string, userId: string): Promise<boolean> {
  const db = await getDb()
  const today = new Date()
  const created = await seedDemoIntoHousehold(db, { householdId, userId, today })
  if (!created) return false
  await seedDemoSource(db, householdId)
  await setGoalDateIfMissing(db, householdId, today)
  return true
}
