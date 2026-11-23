import { describe, expect, it } from 'vitest'
import { formatGermanDateTime } from './date-time'

describe('formatGermanDateTime', () => {
  it('zeigt Datum und Uhrzeit in deutscher Zeit, auch über die Zeitumstellung', () => {
    expect(formatGermanDateTime(new Date('2026-11-23T02:00:00Z'))).toBe('23.11.2026, 03:00')
    expect(formatGermanDateTime(new Date('2026-07-01T02:00:00Z'))).toBe('01.07.2026, 04:00')
  })
})
