// Ordner mit den Migrationen bis einschließlich `lastTag`, damit sich ein älterer Stand herstellen
// lässt: dort alte Daten einfügen, danach alle Migrationen einspielen und das Ergebnis prüfen.
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const MIGRATIONS = 'db/migrations'

interface Journal {
  entries: { tag: string }[]
}

export async function migrationsUntil(lastTag: string): Promise<string> {
  const folder = await mkdtemp(path.join(tmpdir(), `preposaurus-${lastTag}-`))
  await mkdir(path.join(folder, 'meta'))
  const journalText = await readFile(path.join(MIGRATIONS, 'meta', '_journal.json'), 'utf8')
  const journal = JSON.parse(journalText) as Journal
  const lastIndex = journal.entries.findIndex((entry) => entry.tag === lastTag)
  if (lastIndex < 0) throw new Error(`Migration ${lastTag} fehlt`)
  const entries = journal.entries.slice(0, lastIndex + 1)
  await writeFile(
    path.join(folder, 'meta', '_journal.json'),
    JSON.stringify({ ...journal, entries }),
  )
  for (const { tag } of entries) {
    await copyFile(path.join(MIGRATIONS, `${tag}.sql`), path.join(folder, `${tag}.sql`))
  }
  return folder
}
