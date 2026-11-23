// Fortschritt der Ersteinrichtung (#40) in haushalt_einstellung: einrichtung_schritt (zuletzt
// erledigt) und einrichtung_abgeschlossen_am. Wer eingerichtet hat, steht nicht in einer eigenen
// Spalte: Es ist der erste Nutzer des Haushalts, solange er Admin ist. Die Einrichtung legt ihn als
// einzigen Nutzer an, alle weiteren entstehen später. So braucht es keine Migration.
import 'server-only'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import type { SetupProgress } from '@/features/auth/domain/setup-steps'
import type { Database } from '@/server/db/connection'
import { users } from '@/server/db/schema/account'
import { householdSettings } from '@/server/db/schema/household'

type StoredSetupProgress = SetupProgress & Readonly<{ householdId: string }>

type StepChange = Readonly<{ householdId: string; step: number }>

export interface SetupProgressRepository {
  /** null ohne Haushalt oder ohne Zeile in haushalt_einstellung */
  readForUser: (userId: string) => Promise<StoredSetupProgress | null>
  /** Merkt den Schritt als erledigt. Zurückgehen setzt den Fortschritt nicht zurück. */
  markDone: (change: StepChange) => Promise<void>
  complete: (change: StepChange & Readonly<{ now: Date }>) => Promise<void>
}

async function readSettings(db: Database, userId: string) {
  const [row] = await db
    .select({
      householdId: householdSettings.householdId,
      lastDoneStep: householdSettings.setupStep,
      completedAt: householdSettings.setupCompletedAt,
    })
    .from(users)
    .innerJoin(householdSettings, eq(householdSettings.householdId, users.householdId))
    .where(eq(users.id, userId))
  return row
}

async function firstUserOf(db: Database, householdId: string) {
  const [row] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.householdId, householdId))
    .orderBy(asc(users.createdAt), asc(users.id))
    .limit(1)
  return row
}

async function readForUser(db: Database, userId: string): Promise<StoredSetupProgress | null> {
  const settings = await readSettings(db, userId)
  if (settings === undefined) return null
  const first = await firstUserOf(db, settings.householdId)
  return { ...settings, isSetupAdmin: first?.id === userId && first.role === 'admin' }
}

const atLeast = (step: number) =>
  sql`greatest(coalesce(${householdSettings.setupStep}, 0), ${step}::smallint)`

const stillOpen = (householdId: string) =>
  and(eq(householdSettings.householdId, householdId), isNull(householdSettings.setupCompletedAt))

export function createSetupProgressRepository(db: Database): SetupProgressRepository {
  return {
    readForUser: (userId) => readForUser(db, userId),
    async markDone({ householdId, step }) {
      await db
        .update(householdSettings)
        .set({ setupStep: atLeast(step) })
        .where(stillOpen(householdId))
    },
    async complete({ householdId, step, now }) {
      await db
        .update(householdSettings)
        .set({ setupStep: atLeast(step), setupCompletedAt: now })
        .where(stillOpen(householdId))
    },
  }
}
