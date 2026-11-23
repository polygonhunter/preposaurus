// Abgehakte und ausgeblendete Lücken bis zum Ziel (#201): Einträge mit quelle = ziel, Warengruppe
// und Fehlmenge als Momentaufnahme. Jede Abfrage filtert auf haushalt_id (#133).
import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { productGroups } from '@/server/db/schema/recommendation'
import { restockItems } from '@/server/db/schema/restock'
import type { ContentQuantity } from '@/shared/lib/quantities'
import type { GoalEntryStatus } from '../domain/goal-entries'

interface GapEntry {
  groupKey: string
  label: string
  missing: ContentQuantity
  status: GoalEntryStatus
}

const GOAL_SOURCE = 'ziel'

/** Zwei Nachkommastellen wie die Spalte menge */
const toAmount = (value: number) => value.toFixed(2)

async function findGroupId(db: Database, groupKey: string) {
  const [group] = await db
    .select({ id: productGroups.id })
    .from(productGroups)
    .where(eq(productGroups.key, groupKey))
  return group?.id ?? null
}

/**
 * Legt den Eintrag an oder ersetzt den der Warengruppe mit demselben Status (eindeutiger Index
 * nachkauf_eintrag_ziel_eindeutig). Zwei schnelle Tipps ergeben so nie zwei Einträge.
 */
export async function saveGapEntry(db: Database, householdId: string, entry: GapEntry) {
  const productGroupId = await findGroupId(db, entry.groupKey)
  if (productGroupId === null) return null
  const snapshot = {
    label: entry.label,
    amount: toAmount(entry.missing.value),
    unit: entry.missing.unit,
    doneAt: new Date(),
  }
  const [saved] = await db
    .insert(restockItems)
    .values({ householdId, productGroupId, source: GOAL_SOURCE, status: entry.status, ...snapshot })
    .onConflictDoUpdate({
      target: [restockItems.householdId, restockItems.productGroupId, restockItems.status],
      targetWhere: sql`${restockItems.source} = 'ziel'`,
      set: snapshot,
    })
    .returning({ id: restockItems.id })
  return saved?.id ?? null
}

/** Löscht einen Lücken-Eintrag; true, wenn es einer war. Danach ist die Lücke wieder live da. */
export async function removeGapEntry(db: Database, householdId: string, id: string) {
  const removed = await db
    .delete(restockItems)
    .where(
      and(
        eq(restockItems.householdId, householdId),
        eq(restockItems.id, id),
        eq(restockItems.source, GOAL_SOURCE),
      ),
    )
    .returning({ id: restockItems.id })
  return removed.length > 0
}
