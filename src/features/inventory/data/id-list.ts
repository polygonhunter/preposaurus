// Viele IDs als ein einziger Parameter (#141). `inArray` braucht je ID einen Platzhalter, und
// node-postgres bricht ab 65.535 Parametern ab. `= any($1::uuid[])` bleibt bei einem Parameter,
// egal wie viele Produkte ein Haushalt hat.
import 'server-only'
import { sql, type SQL } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export function isAnyOf(column: AnyPgColumn, ids: readonly string[]): SQL {
  return sql`${column} = any(${sql.param([...ids])}::uuid[])`
}
