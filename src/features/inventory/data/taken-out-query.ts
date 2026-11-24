// Verlauf des Haushalts (#48, UX-Konzept D7): verbrauchte und entsorgte Packungen mit Zeitpunkt
// und Person, neueste zuerst. Gefiltert auf den Haushalt über das Produkt (#133), auf Wunsch auf
// bestimmte Produkte (eine Lebensmittelart) und ab einem Zeitpunkt.
import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'
import type { HistoryOutcome, TakenOutUnit } from '@/features/inventory/domain/history'
import type { Database } from '@/server/db/connection'
import { users } from '@/server/db/schema/account'
import { products, units } from '@/server/db/schema/inventory'
import { DB_UNIT_STATUS, toBestBefore, toUnitStatus, type BestBeforeColumns } from './db-values'
import { productCondition, takenFromCondition } from './stock-units-query'

export type TakenOutQuery = Readonly<{
  /** Ohne Liste alle Produkte des Haushalts */
  productIds?: readonly string[]
  outcomes: readonly HistoryOutcome[]
  /** Erster Augenblick des Zeitraums, null ohne Anfang */
  takenFrom: Date | null
  limit: number
}>

function toOutcome(status: Parameters<typeof toUnitStatus>[0]): HistoryOutcome {
  const outcome = toUnitStatus(status)
  // Die Abfrage lädt nur verbraucht und entsorgt, eine Packung im Vorrat wäre ein Fehler
  if (outcome === 'stock') throw new Error('Packung im Vorrat im Verlauf')
  return outcome
}

const columns = {
  id: units.id,
  productId: units.productId,
  status: units.status,
  takenAt: units.takenAt,
  takenBy: users.name,
  bestBefore: units.bestBefore,
  precision: units.bestBeforePrecision,
  isEstimated: units.isBestBeforeEstimated,
}

type Row = BestBeforeColumns & {
  id: string
  productId: string
  status: Parameters<typeof toUnitStatus>[0]
  takenAt: Date | null
  takenBy: string | null
}

function toTakenOutUnit(row: Row): TakenOutUnit[] {
  // Verbraucht und entsorgt haben immer einen Zeitpunkt (einheit_entnahme_check)
  if (row.takenAt === null) return []
  const { id, productId, takenAt, takenBy } = row
  return [
    {
      id,
      productId,
      outcome: toOutcome(row.status),
      takenAt,
      takenBy,
      bestBefore: toBestBefore(row),
    },
  ]
}

export async function loadTakenOutUnits(
  db: Database,
  householdId: string,
  query: TakenOutQuery,
): Promise<TakenOutUnit[]> {
  if (query.productIds?.length === 0 || query.outcomes.length === 0) return []
  const rows = await db
    .select(columns)
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .leftJoin(users, eq(users.id, units.takenBy))
    .where(
      and(
        eq(products.householdId, householdId),
        productCondition(query.productIds),
        inArray(
          units.status,
          query.outcomes.map((outcome) => DB_UNIT_STATUS[outcome]),
        ),
        takenFromCondition(query.takenFrom),
      ),
    )
    .orderBy(desc(units.takenAt), desc(units.id))
    .limit(query.limit)
  return rows.flatMap(toTakenOutUnit)
}
