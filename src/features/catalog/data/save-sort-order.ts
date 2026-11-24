// Reihenfolge eigener Einträge eines Haushalts speichern (Lagerorte, eigene Lebensmittelarten).
// Die Zeilen werden zuerst nach ID sortiert gesperrt, dann umnummeriert (#281). So sperren zwei
// gleichzeitige Klicks auf „nach oben/unten“ in derselben Reihenfolge: Der zweite wartet, statt
// mit dem ersten in einen Deadlock zu laufen. Fremde IDs bleiben unberührt.
import 'server-only'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import type { Database } from '@/server/db/connection'

type SortableTable = PgTable & {
  id: PgColumn
  householdId: PgColumn
  sortOrder: PgColumn
}

export async function saveSortOrder(
  db: Database,
  table: SortableTable,
  { householdId, ids }: Readonly<{ householdId: string; ids: readonly string[] }>,
): Promise<void> {
  if (ids.length === 0) return
  const own = (id: string) => and(eq(table.householdId, householdId), eq(table.id, id))
  await db.transaction(async (tx) => {
    await tx
      .select({ id: table.id })
      .from(table)
      .where(and(eq(table.householdId, householdId), inArray(table.id, [...ids])))
      .orderBy(asc(table.id))
      .for('update')
    for (const [sortOrder, id] of ids.entries()) {
      await tx.update(table).set({ sortOrder }).where(own(id))
    }
  })
}
