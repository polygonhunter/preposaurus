// Daten der Erinnerungen: Zeitplan und Merker je Haushalt (SCHNITTSTELLEN Nr. 27), Erfassungs-
// zeitpunkte, Adressen und Check-in-Abos. Jede Abfrage auf einen Haushalt filtert auf haushalt_id.
import 'server-only'
import { and, count, eq, inArray, isNull, isNotNull } from 'drizzle-orm'
import type { ReminderKind } from '@/features/reminders/domain/message'
import type { Database } from '@/server/db/connection'
import { users } from '@/server/db/schema/account'
import { householdSettings } from '@/server/db/schema/household'
import { products, units } from '@/server/db/schema/inventory'
import { notificationSettings } from '@/server/db/schema/reminders'

const MARK_COLUMNS = {
  'weekly-summary': 'weeklySummarySentAt',
  urgent: 'urgentSentAt',
} as const satisfies Record<ReminderKind, keyof typeof householdSettings.$inferInsert>

async function listHouseholds(db: Database) {
  const rows = await db.select().from(householdSettings)
  return rows.map((row) => ({
    householdId: row.householdId,
    settings: {
      weeklySummary: {
        isEnabled: row.weeklySummaryEnabled,
        weekday: row.weeklySummaryWeekday,
        time: row.weeklySummaryTime,
      },
      isUrgentEnabled: row.urgentEnabled,
    },
    lastSent: { 'weekly-summary': row.weeklySummarySentAt, urgent: row.urgentSentAt },
  }))
}

async function loadAddedTimes(db: Database, householdId: string, unitIds: readonly string[]) {
  if (unitIds.length === 0) return new Map<string, Date>()
  const rows = await db
    .select({ id: units.id, addedAt: units.createdAt })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .where(and(eq(products.householdId, householdId), inArray(units.id, [...unitIds])))
  return new Map(rows.map((row) => [row.id, row.addedAt]))
}

async function countMissingDates(db: Database, householdId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .where(
      and(
        eq(products.householdId, householdId),
        eq(units.status, 'vorrat'),
        isNull(units.bestBefore),
      ),
    )
  return row?.total ?? 0
}

async function listAddresses(db: Database, householdId: string): Promise<string[]> {
  const rows = await db
    .select({ address: users.email })
    .from(users)
    .where(and(eq(users.householdId, householdId), eq(users.isActive, true)))
  return rows.map((row) => row.address)
}

async function listCheckInRecipients(db: Database, cadence: string) {
  const rows = await db
    .select({ householdId: users.householdId, address: users.email })
    .from(notificationSettings)
    .innerJoin(users, eq(users.id, notificationSettings.userId))
    .where(
      and(
        eq(notificationSettings.kind, 'checkin_mail'),
        eq(notificationSettings.isEnabled, true),
        eq(notificationSettings.schedule, cadence),
        eq(users.isActive, true),
        isNotNull(users.householdId),
      ),
    )
  return rows.flatMap(({ householdId, address }) =>
    householdId === null ? [] : [{ householdId, address }],
  )
}

async function markSent(
  db: Database,
  householdId: string,
  marks: { kinds: readonly ReminderKind[]; at: Date },
) {
  const values = Object.fromEntries(marks.kinds.map((kind) => [MARK_COLUMNS[kind], marks.at]))
  if (Object.keys(values).length === 0) return
  await db
    .update(householdSettings)
    .set(values)
    .where(eq(householdSettings.householdId, householdId))
}

export function createReminderRepository(db: Database) {
  return {
    listHouseholds: () => listHouseholds(db),
    loadAddedTimes: (householdId: string, unitIds: readonly string[]) =>
      loadAddedTimes(db, householdId, unitIds),
    countMissingDates: (householdId: string) => countMissingDates(db, householdId),
    listAddresses: (householdId: string) => listAddresses(db, householdId),
    listCheckInRecipients: (cadence: string) => listCheckInRecipients(db, cadence),
    markSent: (householdId: string, kinds: readonly ReminderKind[], at: Date) =>
      markSent(db, householdId, { kinds, at }),
  }
}
