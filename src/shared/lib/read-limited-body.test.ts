import { describe, expect, it } from 'vitest'
import { readLimitedBody } from './read-limited-body'

function streamOf(...chunks: number[][]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new Uint8Array(chunk))
      controller.close()
    },
  })
}

describe('readLimitedBody', () => {
  it('fügt die Teile in Reihenfolge zusammen', async () => {
    expect(await readLimitedBody(streamOf([1, 2], [3], [4, 5]), 5)).toEqual(
      new Uint8Array([1, 2, 3, 4, 5]),
    )
  })

  it('liefert ohne Body ein leeres Array', async () => {
    expect(await readLimitedBody(null, 5)).toEqual(new Uint8Array(0))
  })

  it('bricht beim ersten Byte über der Grenze ab und gibt den Stream frei', async () => {
    let cancelled = false
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(4))
      },
      cancel() {
        cancelled = true
      },
    })

    expect(await readLimitedBody(stream, 10)).toBeNull()
    expect(cancelled).toBe(true)
  })
})
