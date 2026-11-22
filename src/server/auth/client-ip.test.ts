import { describe, expect, it } from 'vitest'
import { readClientIp } from './client-ip'

const read = (value: string | null, header = 'x-forwarded-for') =>
  readClientIp(new Headers(value === null ? {} : { [header]: value }), header)

describe('readClientIp', () => {
  it('liest eine einzelne Adresse aus dem eingestellten Header', () => {
    expect(read('100.64.0.7')).toBe('100.64.0.7')
    expect(read(' FD7A:115C:A1E0::1 ')).toBe('fd7a:115c:a1e0::1')
    expect(read('100.64.0.7', 'x-real-ip')).toBe('100.64.0.7')
  })

  it('liefert null ohne Header, bei Unsinn oder einer Liste mehrerer Adressen', () => {
    expect(read(null)).toBeNull()
    expect(read('')).toBeNull()
    expect(read('kein-ip')).toBeNull()
    expect(read('1.2.3.4, 100.64.0.7')).toBeNull()
  })
})
