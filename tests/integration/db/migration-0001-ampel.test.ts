// Migration 0001 auf alten Daten (#135): Vor dem neuen Ampel-CHECK hebt sie Orange unter 7 Tagen
// auf 7 an, Gelb bei Bedarf mit. Dafür nur 0000 einspielen, alte Werte einfügen, dann 0001.
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { asc, eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import { createEmptyTestDb, type TestDb } from '../../helpers/test-db'

const MIGRATIONS = 'db/migrations'
const BASE_TAG = '0000_basis'

interface Journal {
  entries: { tag: string }[]
}

/** Ordner, der nur die Basis-Migration enthält, damit sich der Stand vor 0001 herstellen lässt. */
async function baseOnlyFolder(): Promise<string> {
  const folder = await mkdtemp(path.join(tmpdir(), 'preposaurus-0000-'))
  await mkdir(path.join(folder, 'meta'))
  const journalText = await readFile(path.join(MIGRATIONS, 'meta', '_journal.json'), 'utf8')
  const journal = JSON.parse(journalText) as Journal
  const entries = journal.entries.filter((entry) => entry.tag === BASE_TAG)
  await writeFile(
    path.join(folder, 'meta', '_journal.json'),
    JSON.stringify({ ...journal, entries }),
  )
  await copyFile(path.join(MIGRATIONS, `${BASE_TAG}.sql`), path.join(folder, `${BASE_TAG}.sql`))
  return folder
}

// Orange/Gelb vor der Migration → erwartet danach
const CASES = [
  { name: 'a', before: [3, 5], after: [7, 7] },
  { name: 'b', before: [3, 90], after: [7, 90] },
  { name: 'c', before: [6, 7], after: [7, 7] },
  { name: 'd', before: [28, 90], after: [28, 90] },
] as const

describe('Migration 0001: Ampel-Schwellen anheben', () => {
  let testDb: TestDb
  let folder: string

  beforeAll(async () => {
    testDb = await createEmptyTestDb()
    folder = await baseOnlyFolder()
    await testDb.migrate(folder)
    for (const { name, before } of CASES) {
      const [orange, yellow] = before
      await testDb.db.execute(sql`
        with haushalt_neu as (
          insert into ${households} (id, name) values (gen_random_uuid(), ${name}) returning id
        )
        insert into ${householdSettings} (id, haushalt_id, ampel_orange_tage, ampel_gelb_tage)
        select gen_random_uuid(), id, ${orange}, ${yellow} from haushalt_neu`)
    }
    await testDb.migrate()
  })

  afterAll(async () => {
    await testDb.close()
    await rm(folder, { recursive: true, force: true })
  })

  it('hebt Orange unter 7 auf 7 an, Gelb bei Bedarf mit, und lässt gültige Werte stehen', async () => {
    const rows = await testDb.db
      .select({
        name: households.name,
        orange: householdSettings.ampelOrangeDays,
        yellow: householdSettings.ampelYellowDays,
      })
      .from(householdSettings)
      .innerJoin(households, eq(households.id, householdSettings.householdId))
      .orderBy(asc(households.name))

    expect(rows).toEqual(
      CASES.map(({ name, after }) => ({ name, orange: after[0], yellow: after[1] })),
    )
  })
})
