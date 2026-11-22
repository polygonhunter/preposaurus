import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { connectDatabase } from '../../../src/server/db/client'

describe('connectDatabase mit PGlite', () => {
  let tempDir: string | undefined

  afterEach(async () => {
    if (tempDir !== undefined) await rm(tempDir, { recursive: true, force: true })
  })

  const selectOne = async (url: string) => {
    const connection = await connectDatabase(url)
    try {
      const [row] = await connection.db.select({ one: sql<number>`1` }).from(sql`(select 1) as t`)
      return row?.one
    } finally {
      await connection.close()
    }
  }

  it.each(['pglite://', 'pglite://memory'])(
    'läuft ohne Ordner nur im Speicher (%s)',
    async (url) => {
      expect(await selectOne(url)).toBe(1)
    },
  )

  it('legt den Datenordner samt fehlender Elternordner an', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'preposaurus-'))
    const dataDir = join(tempDir, 'neu', 'dev')

    expect(await selectOne(`pglite://${dataDir}`)).toBe(1)
    expect(existsSync(join(dataDir, 'PG_VERSION'))).toBe(true)
  })
})
