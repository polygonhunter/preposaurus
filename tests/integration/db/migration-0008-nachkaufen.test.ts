// Migration 0008 auf alten Daten (#201): Aus erledigt (boolean) wird status, abgehakte Einträge
// bekommen erledigt_am aus updated_at. Dafür nur bis 0007 einspielen, alte Zeilen einfügen (mit
// rohem SQL, weil es die Spalte erledigt im Schema nicht mehr gibt), dann alle Migrationen.
import { rm } from 'node:fs/promises'
import { asc, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { restockItems } from '../../../src/server/db/schema/restock'
import { migrationsUntil } from '../../helpers/migration-folder'
import { createEmptyTestDb, type TestDb } from '../../helpers/test-db'

// Frei gewählte Testdaten.
const CHANGED_AT = '2026-11-20T10:00:00.000Z'

describe('Migration 0008: Nachkaufen mit Status', () => {
  let testDb: TestDb
  let folder: string

  beforeAll(async () => {
    testDb = await createEmptyTestDb()
    folder = await migrationsUntil('0007_einheit_erfassung_aufschiebbar')
    await testDb.migrate(folder)
    await testDb.db.execute(sql`
      with haushalt_neu as (
        insert into haushalt (id, name) values (gen_random_uuid(), 'Alt') returning id
      )
      insert into nachkauf_eintrag (id, haushalt_id, bezeichnung, quelle, erledigt, updated_at)
      select gen_random_uuid(), id, eintrag.name, 'manuell', eintrag.erledigt, ${CHANGED_AT}
      from haushalt_neu, (values ('a offen', false), ('b erledigt', true)) as eintrag(name, erledigt)`)
    await testDb.migrate()
  })

  afterAll(async () => {
    await testDb.close()
    await rm(folder, { recursive: true, force: true })
  })

  it('übernimmt offene und abgehakte Einträge, abgehakte mit dem Zeitpunkt ihrer letzten Änderung', async () => {
    const rows = await testDb.db
      .select({
        label: restockItems.label,
        status: restockItems.status,
        doneAt: restockItems.doneAt,
      })
      .from(restockItems)
      .orderBy(asc(restockItems.label))

    expect(rows).toEqual([
      { label: 'a offen', status: 'offen', doneAt: null },
      { label: 'b erledigt', status: 'erledigt', doneAt: new Date(CHANGED_AT) },
    ])
  })
})
