import type { Pool } from 'pg'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { connectPostgres } from './postgres-driver'

// Baut keine Verbindung auf: Der Pool verbindet erst bei der ersten Abfrage.
const UNUSED_URL = 'postgres://test@127.0.0.1:1/test'

describe('connectPostgres', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('übersteht den Abbruch eines ruhenden Clients und protokolliert ihn', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const connection = connectPostgres(UNUSED_URL)
    const pool = (connection.db as unknown as { $client: Pool }).$client
    const terminated = Object.assign(new Error('terminating connection'), { code: '57P01' })

    expect(() => pool.emit('error', terminated)).not.toThrow()
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"level":"warn"'))
    await connection.close()
  })

  it('setzt den Namen der Verbindung nur, wenn einer übergeben ist (#261)', async () => {
    const poolOf = (connection: ReturnType<typeof connectPostgres>) =>
      (connection.db as unknown as { $client: Pool & { options: { application_name?: string } } })
        .$client
    const named = connectPostgres(UNUSED_URL, 'preposaurus-web')
    const unnamed = connectPostgres(UNUSED_URL)

    expect(poolOf(named).options.application_name).toBe('preposaurus-web')
    expect(poolOf(unnamed).options.application_name).toBeUndefined()
    await Promise.all([named.close(), unnamed.close()])
  })
})
