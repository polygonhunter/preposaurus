import { describe, expect, it } from 'vitest'
import { createRetryQueue, type QueueUpdate } from './retry-queue'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function setup(concurrency = 2, maxAttempts = 3) {
  const updates: QueueUpdate<string>[] = []
  const waits: number[] = []
  const queue = createRetryQueue<string>({
    concurrency,
    maxAttempts,
    retryDelayMs: 100,
    onUpdate: (update) => updates.push(update),
    wait: (ms) => {
      waits.push(ms)
      return Promise.resolve()
    },
  })
  const last = (id: string) => updates.filter((update) => update.id === id).at(-1)
  return { queue, updates, waits, last }
}

function deferred() {
  let resolve: (value: string) => void = () => undefined
  const promise = new Promise<string>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('createRetryQueue', () => {
  it('liefert das Ergebnis einer gelungenen Aufgabe', async () => {
    const { queue, last } = setup()

    queue.add('a', () => Promise.resolve('foto-1'))
    await flush()

    expect(last('a')).toEqual({ id: 'a', status: 'done', attempt: 1, result: 'foto-1' })
  })

  it('lässt höchstens zwei Aufgaben gleichzeitig laufen', async () => {
    const { queue, last } = setup(2)
    const first = deferred()
    const second = deferred()

    queue.add('a', () => first.promise)
    queue.add('b', () => second.promise)
    queue.add('c', () => Promise.resolve('c'))
    await flush()
    expect(last('c')?.status).toBe('waiting')

    first.resolve('a')
    await flush()
    await flush()
    expect(last('c')?.status).toBe('done')
  })

  it('wiederholt nach einem Fehler mit wachsender Pause', async () => {
    const { queue, waits, last } = setup()
    let calls = 0

    queue.add('a', () => {
      calls += 1
      return calls < 3 ? Promise.reject(new Error('Netz weg')) : Promise.resolve('ok')
    })
    for (let i = 0; i < 6; i += 1) await flush()

    expect(waits).toEqual([100, 200])
    expect(last('a')).toMatchObject({ status: 'done', attempt: 3 })
  })

  it('meldet nach dem letzten Versuch „failed“ und versucht es auf Wunsch neu', async () => {
    const { queue, last } = setup(1, 2)
    let isOnline = false

    queue.add('a', () => (isOnline ? Promise.resolve('ok') : Promise.reject(new Error('offline'))))
    for (let i = 0; i < 6; i += 1) await flush()
    expect(last('a')).toMatchObject({ status: 'failed', attempt: 2 })

    isOnline = true
    queue.retry('a')
    await flush()
    expect(last('a')).toMatchObject({ status: 'done', attempt: 1 })
  })

  it('ignoriert ein Neu-Versuchen ohne gescheiterte Aufgabe', () => {
    const { queue, updates } = setup()

    queue.retry('unbekannt')

    expect(updates).toEqual([])
  })

  it('startet nach stop() nichts mehr, wiederholt nicht und meldet nichts', async () => {
    const { queue, updates } = setup(1)
    const first = deferred()
    let calls = 0

    queue.add('a', () => first.promise)
    queue.add('b', () => {
      calls += 1
      return Promise.resolve('b')
    })
    await flush()
    const before = updates.length
    queue.stop()
    first.resolve('a')
    queue.add('c', () => Promise.resolve('c'))
    for (let i = 0; i < 4; i += 1) await flush()

    expect(calls).toBe(0)
    expect(updates).toHaveLength(before)
  })

  it('wiederholt eine gescheiterte Aufgabe nach stop() nicht mehr', async () => {
    const { queue, last } = setup(1, 3)
    let calls = 0

    queue.add('a', () => {
      calls += 1
      queue.stop()
      return Promise.reject(new Error('Netz weg'))
    })
    for (let i = 0; i < 6; i += 1) await flush()

    expect(calls).toBe(1)
    expect(last('a')?.status).toBe('running')
  })
})
