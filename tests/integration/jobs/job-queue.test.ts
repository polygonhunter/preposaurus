// Warteschlange mit echtem pg-boss (UMSETZUNG M11-01): lokal auf PGlite, in der CI zusätzlich auf
// PostgreSQL 18 (Job test-pg).
import { PgBoss } from 'pg-boss'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { defineJob } from '../../../src/server/jobs/job-definition'
import { startJobQueue, type JobQueue } from '../../../src/server/jobs/job-queue'
import { createMemoryLogger, type MemoryLogger } from '../../helpers/memory-logger'
import { createTestJobDatabase } from '../../helpers/test-job-database'

type TestJobDatabase = Awaited<ReturnType<typeof createTestJobDatabase>>

const schema = z.strictObject({ value: z.string() })
// Ohne Pause zwischen den Versuchen, damit der Test nicht wartet.
const retry = { limit: 2, delaySeconds: 0 }
const WAIT = { timeout: 20_000, interval: 200 }

let testDb: TestJobDatabase
let memory: MemoryLogger
let queue: JobQueue | undefined

beforeEach(async () => {
  testDb = await createTestJobDatabase()
  memory = createMemoryLogger()
})

afterEach(async () => {
  await queue?.stop()
  queue = undefined
  await testDb.close()
})

function startWith(jobs: Parameters<typeof startJobQueue>[0]['jobs']) {
  return startJobQueue({ database: testDb.database, jobs, logger: memory.logger })
}

describe('startJobQueue', () => {
  it('führt einen eingestellten Job mit seiner Payload aus', async () => {
    const seen: string[] = []
    const job = defineJob({
      name: 'echo',
      schema,
      schedule: null,
      retry,
      run: ({ value }) => {
        seen.push(value)
        return Promise.resolve()
      },
    })
    queue = await startWith([job])

    await queue.send('echo', { value: 'hallo' })

    await vi.waitFor(() => {
      expect(seen).toEqual(['hallo'])
    }, WAIT)
    await vi.waitFor(() => {
      expect(memory.messages()).toContain('Job erledigt')
    }, WAIT)
  })

  it('protokolliert einen Fehler und wiederholt den Job', async () => {
    let attempts = 0
    const job = defineJob({
      name: 'flaky',
      schema,
      schedule: null,
      retry,
      run: () => {
        attempts += 1
        return attempts === 1 ? Promise.reject(new Error('kurz weg')) : Promise.resolve()
      },
    })
    queue = await startWith([job])

    await queue.send('flaky', { value: 'x' })

    await vi.waitFor(() => {
      expect(memory.messages()).toContain('Job erledigt')
    }, WAIT)
    expect(attempts).toBe(2)
    expect(memory.messages()).toContain('Job fehlgeschlagen, pg-boss versucht es erneut')
  })

  it('legt den Zeitplan in Europe/Berlin an und entfernt ihn, wenn der Job keinen mehr hat', async () => {
    const definition = { name: 'nightly', schema, retry, run: () => Promise.resolve() }
    const schedule = { cron: '30 4 * * *', payload: { value: 'nachts' } }
    queue = await startWith([defineJob({ ...definition, schedule })])

    expect(await testDb.queryRows('select name, cron, timezone from pgboss.schedule')).toEqual([
      { name: 'nightly', cron: '30 4 * * *', timezone: 'Europe/Berlin' },
    ])

    await queue.stop()
    queue = await startWith([defineJob({ ...definition, schedule: null })])
    expect(await testDb.queryRows('select name from pgboss.schedule')).toEqual([])
  })

  it('übernimmt geänderte Versuche beim nächsten Start', async () => {
    const definition = { name: 'tuned', schema, schedule: null, run: () => Promise.resolve() }
    queue = await startWith([defineJob({ ...definition, retry })])
    await queue.stop()

    queue = await startWith([defineJob({ ...definition, retry: { limit: 5, delaySeconds: 10 } })])

    expect(
      await testDb.queryRows(
        "select retry_limit, retry_delay from pgboss.queue where name = 'tuned'",
      ),
    ).toEqual([{ retry_limit: 5, retry_delay: 10 }])
  })

  it('stellt einen Job mit Zeitplan nicht doppelt ein, solange einer wartet oder läuft', async () => {
    let release: () => void = () => undefined
    const running = new Promise<void>((resolve) => {
      release = resolve
    })
    const job = defineJob({
      name: 'single',
      schema,
      schedule: { cron: '30 4 * * *', payload: { value: 'nachts' } },
      retry,
      run: () => running,
    })
    queue = await startWith([job])

    expect(await queue.send('single', { value: 'eins' })).not.toBeNull()
    expect(await queue.send('single', { value: 'zwei' })).toBeNull()
    release()
  })

  it('schließt die Warteschlange wieder, wenn der Start scheitert', async () => {
    const stop = vi.spyOn(PgBoss.prototype, 'stop')
    const broken = defineJob({
      name: 'broken',
      schema,
      schedule: { cron: 'kein cron', payload: { value: 'x' } },
      retry,
      run: () => Promise.resolve(),
    })

    await expect(startWith([broken])).rejects.toThrow()

    expect(stop).toHaveBeenCalledWith({ graceful: false })
    stop.mockRestore()
  })
})
