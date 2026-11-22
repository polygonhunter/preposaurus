// Bausteine, die jede Tabelle teilt (CODE_PRINZIPIEN §8: id, created_at, updated_at).
// Die Schema-Dateien importieren kein server-only, weil drizzle-kit sie außerhalb von Next lädt.
import { sql, type SQL } from 'drizzle-orm'
import { timestamp, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core'

// Die App erzeugt die IDs, nicht die DB (UMSETZUNG Grundentscheidung 5).
export const id = () =>
  uuid('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

export const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const timestampTz = (name: string) => timestamp(name, { withTimezone: true })

// Text mit fester Werteliste als CHECK statt als PostgreSQL-Enum: Neue Werte brauchen so nur
// eine kleine Migration. Die Werte sind feste Konstanten aus dem Code, nie Nutzereingaben.
export function isOneOf(column: AnyPgColumn, values: readonly string[]): SQL {
  const list = values.map((value) => `'${value}'`).join(', ')
  return sql`${column} in (${sql.raw(list)})`
}
