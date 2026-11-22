import { describe, expect, it } from 'vitest'
import { createUuid } from './uuid'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('createUuid', () => {
  it('nutzt randomUUID, wenn vorhanden', () => {
    const source = {
      randomUUID: () => '11111111-1111-4111-8111-111111111111' as const,
      getRandomValues: <T extends ArrayBufferView>(array: T) => array,
    }
    expect(createUuid(source)).toBe('11111111-1111-4111-8111-111111111111')
  })

  it('baut ohne randomUUID (kein sicherer Kontext) eine gültige v4 aus Zufallsbytes', () => {
    const source = {
      getRandomValues: <T extends ArrayBufferView>(array: T) => {
        new Uint8Array(array.buffer).fill(0xff)
        return array
      },
    }
    expect(createUuid(source)).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
    expect(createUuid(source)).toMatch(UUID_V4)
  })

  it('liefert im Testlauf zufällige, verschiedene Werte', () => {
    expect(createUuid()).toMatch(UUID_V4)
    expect(createUuid()).not.toBe(createUuid())
  })
})
