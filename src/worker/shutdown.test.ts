import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryLogger } from '../../tests/helpers/memory-logger'
import { stopOnSignal } from './shutdown'

function setUp(stop: () => Promise<void>) {
  const source = new EventEmitter()
  const memory = createMemoryLogger()
  const onFailure = vi.fn()
  stopOnSignal(source, { stop, logger: memory.logger, onFailure })
  return { source, onFailure, ...memory }
}

describe('stopOnSignal', () => {
  it('stoppt bei SIGTERM genau einmal, auch wenn danach SIGINT kommt', async () => {
    const stop = vi.fn(() => Promise.resolve())
    const { source, messages } = setUp(stop)

    source.emit('SIGTERM')
    source.emit('SIGINT')
    await vi.waitFor(() => {
      expect(messages()).toContain('Worker beendet')
    })

    expect(stop).toHaveBeenCalledTimes(1)
    expect(messages()).toEqual(['Worker wird beendet', 'Worker beendet'])
  })

  it('meldet einen gescheiterten Stopp', async () => {
    const { source, onFailure, messages } = setUp(() => Promise.reject(new Error('hängt')))

    source.emit('SIGINT')
    await vi.waitFor(() => {
      expect(onFailure).toHaveBeenCalledTimes(1)
    })

    expect(messages()).toContain('Worker ließ sich nicht sauber beenden')
  })
})
