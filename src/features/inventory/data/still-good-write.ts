// „Noch gut“ und sein Rückgängig (#47). Beide Updates sind bedingt: auf den Haushalt und auf den
// Zustand der Packung. So prüft niemand eine fremde, eine entnommene oder eine schon geprüfte
// Packung, und das Verbrauchsdatum bleibt außen vor (ROT-06).
import 'server-only'
import { and, count, eq, isNull, lt } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { units } from '@/server/db/schema/inventory'
import { DB_UNIT_STATUS } from './db-values'
import { ownUnits } from './own-units'

type StillGoodChange = Readonly<{ unitIds: readonly string[]; checkedAt: string }>

export async function markStillGood(db: Database, householdId: string, change: StillGoodChange) {
  if (change.unitIds.length === 0) return []
  const updated = await db
    .update(units)
    .set({ checkedAt: change.checkedAt })
    .where(
      and(
        ownUnits(db, householdId, change.unitIds),
        eq(units.status, DB_UNIT_STATUS.stock),
        eq(units.bestBeforeKind, 'mhd'),
        lt(units.bestBefore, change.checkedAt),
        isNull(units.checkedAt),
      ),
    )
    .returning({ id: units.id })
  return updated.map((row) => row.id)
}

export async function undoStillGood(db: Database, householdId: string, change: StillGoodChange) {
  if (change.unitIds.length === 0) return
  await db
    .update(units)
    .set({ checkedAt: null })
    .where(
      and(
        ownUnits(db, householdId, change.unitIds),
        eq(units.status, DB_UNIT_STATUS.stock),
        eq(units.checkedAt, change.checkedAt),
      ),
    )
}

export async function countOwnUnits(db: Database, householdId: string, unitIds: readonly string[]) {
  if (unitIds.length === 0) return 0
  const [row] = await db
    .select({ total: count() })
    .from(units)
    .where(ownUnits(db, householdId, unitIds))
  return row?.total ?? 0
}
