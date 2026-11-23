import { describe, expect, it } from 'vitest'
import { draftAgeLabel } from './draft-age-label'

const now = new Date('2026-11-23T10:00:00Z')

describe('draftAgeLabel', () => {
  it('nennt heute, gestern und sonst das Datum', () => {
    expect(draftAgeLabel(new Date('2026-11-23T06:00:00Z'), now)).toBe('von heute')
    expect(draftAgeLabel(new Date('2026-11-22T20:00:00Z'), now)).toBe('von gestern')
    expect(draftAgeLabel(new Date('2026-11-05T12:00:00Z'), now)).toBe('vom 05.11.')
  })

  it('rechnet nach Berliner Kalendertag, nicht nach UTC', () => {
    expect(draftAgeLabel(new Date('2026-11-22T23:30:00Z'), now)).toBe('von heute')
  })
})
