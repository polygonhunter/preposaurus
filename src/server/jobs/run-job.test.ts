import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createMemoryLogger } from '../../../tests/helpers/memory-logger'
import { defineJob } from './job-definition'
import { runJob } from './run-job'

const schema = z.strictObject({ count: z.number().int() })

function counterJob(run: (count: number) => Promise<void>) {
  return defineJob({ name: 'counter', schema, schedule: null, run: ({ count }) => run(count) })
}

describe('runJob', () => {
  it('führt den Job mit der geprüften Payload aus und protokolliert das Ende', async () => {
    const seen: number[] = []
    const { logger, messages } = createMemoryLogger()
    const job = counterJob((count) => {
      seen.push(count)
      return Promise.resolve()
    })

    await runJob({ job, payload: { count: 3 }, retryCount: 0 }, logger)

    expect(seen).toEqual([3])
    expect(messages()).toEqual(['Job erledigt'])
  })

  it('führt den Job bei ungültiger Payload nicht aus und wirft nicht, damit nichts wiederholt wird', async () => {
    const seen: number[] = []
    const { logger, entries } = createMemoryLogger()
    const job = counterJob((count) => {
      seen.push(count)
      return Promise.resolve()
    })

    await runJob({ job, payload: { count: 'drei' }, retryCount: 0 }, logger)

    expect(seen).toEqual([])
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      level: 'error',
      message: 'Job-Payload ungültig, der Job wird nicht wiederholt',
      context: { job: 'counter', retryCount: 0 },
    })
    expect(entries[0]?.context?.['issues']).toContain('count')
  })

  it('protokolliert einen Fehler mit Versuch und gibt ihn für einen neuen Versuch weiter', async () => {
    const { logger, entries } = createMemoryLogger()
    const job = counterJob(() => Promise.reject(new Error('DB weg')))

    await expect(runJob({ job, payload: { count: 1 }, retryCount: 2 }, logger)).rejects.toThrow(
      'DB weg',
    )

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      level: 'error',
      message: 'Job fehlgeschlagen, pg-boss versucht es erneut',
      context: { job: 'counter', retryCount: 2 },
    })
  })
})

describe('defineJob', () => {
  it('nimmt ohne Angabe drei neue Versuche ab 30 Sekunden', () => {
    expect(counterJob(() => Promise.resolve()).retry).toEqual({ limit: 3, delaySeconds: 30 })
  })
})
