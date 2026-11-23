// Verlauf einer Lebensmittelart (#48, ROT-07, UX-Konzept §8.4 Punkt 7): verbrauchte und entsorgte
// Packungen mit Zeitpunkt und Person, dazu „Noch gut“ mit dem Tag der Prüfung. Gefiltert auf den
// Haushalt über das Produkt (#133). Die neuesten zuerst, höchstens `limit` Packungen.
import 'server-only'
import { and, desc, eq, isNotNull, ne, or, sql } from 'drizzle-orm'
import type { UnitHistoryRow } from '@/features/inventory/domain/unit-history'
import type { Database } from '@/server/db/connection'
import { users } from '@/server/db/schema/account'
import { products, units } from '@/server/db/schema/inventory'
import { isAnyOf } from './id-list'
import { DB_UNIT_STATUS, toBestBefore, toDayOrNull, toUnitStatus } from './db-values'

type HistoryQuery = Readonly<{ productIds: readonly string[]; limit: number }>

// Jüngstes Ereignis einer Packung: Entnahme, sonst die Prüfung (Mitternacht reicht zum Sortieren)
const lastEventAt = sql`coalesce(${units.takenAt}, ${units.checkedAt}::timestamptz)`

export async function loadUnitHistory(
  db: Database,
  householdId: string,
  { productIds, limit }: HistoryQuery,
): Promise<UnitHistoryRow[]> {
  if (productIds.length === 0) return []
  const rows = await db
    .select({
      status: units.status,
      takenAt: units.takenAt,
      takenBy: users.name,
      checkedAt: units.checkedAt,
      bestBefore: units.bestBefore,
      precision: units.bestBeforePrecision,
      isEstimated: units.isBestBeforeEstimated,
    })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .leftJoin(users, eq(users.id, units.takenBy))
    .where(
      and(
        eq(products.householdId, householdId),
        isAnyOf(units.productId, productIds),
        or(ne(units.status, DB_UNIT_STATUS.stock), isNotNull(units.checkedAt)),
      ),
    )
    .orderBy(desc(lastEventAt), desc(units.id))
    .limit(limit)
  return rows.map((row) => ({
    status: toUnitStatus(row.status),
    takenAt: row.takenAt,
    takenBy: row.takenBy,
    checkedAt: toDayOrNull(row.checkedAt),
    bestBefore: toBestBefore(row),
  }))
}
