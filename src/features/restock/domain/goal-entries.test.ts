import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { coversGap, isWithinDays, splitGaps, type GoalEntryFacts } from './goal-entries'

// Frei gewählte Testdaten.
const today = toCalendarDay('2026-11-22')

const waterGap = { groupKey: 'wasser', missing: { value: 20_000, unit: 'ml' as const } }

const entry = (overrides: Partial<GoalEntryFacts> = {}): GoalEntryFacts => ({
  id: 'z1',
  source: 'ziel',
  status: 'ausgeblendet',
  doneAt: new Date('2026-11-20T10:00:00Z'),
  groupKey: 'wasser',
  amount: { value: 20_000, unit: 'ml' },
  ...overrides,
})

const withMissing = (value: number) => ({ ...waterGap, missing: { value, unit: 'ml' as const } })

describe('isWithinDays', () => {
  it('zählt den letzten Tag noch mit, den Tag davor nicht', () => {
    expect(isWithinDays(new Date('2026-11-08T10:00:00Z'), today, 14)).toBe(true)
    expect(isWithinDays(new Date('2026-11-07T10:00:00Z'), today, 14)).toBe(false)
    expect(isWithinDays(null, today, 14)).toBe(false)
  })

  it('rechnet mit dem Tag in Berlin', () => {
    // 23:30 Uhr UTC ist in Berlin schon der nächste Tag
    expect(isWithinDays(new Date('2026-11-07T23:30:00Z'), today, 14)).toBe(true)
  })
})

describe('coversGap', () => {
  it('verdeckt dieselbe Warengruppe, solange die Lücke nicht über 10 % wächst', () => {
    expect(coversGap(entry(), waterGap, today)).toBe(true)
    expect(coversGap(entry(), withMissing(22_000), today)).toBe(true)
    expect(coversGap(entry(), withMissing(22_001), today)).toBe(false)
  })

  it('verdeckt weiter, wenn die Lücke kleiner wird', () => {
    expect(coversGap(entry(), withMissing(1_000), today)).toBe(true)
  })

  it('verdeckt keine andere Warengruppe und keine andere Maßeinheit', () => {
    expect(coversGap(entry({ groupKey: 'getreide' }), waterGap, today)).toBe(false)
    expect(coversGap(entry({ amount: { value: 20_000, unit: 'g' } }), waterGap, today)).toBe(false)
  })

  it('verdeckt nur mit einem Eintrag „ziel“, der erledigt oder ausgeblendet ist', () => {
    expect(coversGap(entry({ source: 'manuell' }), waterGap, today)).toBe(false)
    expect(coversGap(entry({ status: 'offen' }), waterGap, today)).toBe(false)
    expect(coversGap(entry({ amount: null }), waterGap, today)).toBe(false)
  })

  it('lässt eine ausgeblendete Lücke nach 30 Tagen, eine abgehakte nach 14 Tagen zurück', () => {
    const daysAgo = (iso: string) => new Date(iso)
    const hidden = (iso: string) => entry({ doneAt: daysAgo(iso) })
    const done = (iso: string) => entry({ status: 'erledigt', doneAt: daysAgo(iso) })

    expect(coversGap(hidden('2026-10-23T10:00:00Z'), waterGap, today)).toBe(true)
    expect(coversGap(hidden('2026-10-22T10:00:00Z'), waterGap, today)).toBe(false)
    expect(coversGap(done('2026-11-08T10:00:00Z'), waterGap, today)).toBe(true)
    expect(coversGap(done('2026-11-07T10:00:00Z'), waterGap, today)).toBe(false)
  })
})

describe('splitGaps', () => {
  const grainGap = { groupKey: 'getreide', missing: { value: 3_000, unit: 'g' as const } }

  it('trennt sichtbare und ausgeblendete Lücken; abgehakte stehen in keinem Teil', () => {
    const entries = [
      entry({ id: 'aus' }),
      entry({ id: 'ab', status: 'erledigt', groupKey: 'getreide', amount: grainGap.missing }),
    ]
    const fatGap = { groupKey: 'fette', missing: { value: 500, unit: 'g' as const } }

    const { visible, hidden } = splitGaps([waterGap, grainGap, fatGap], entries, today)

    expect(visible).toEqual([fatGap])
    expect(hidden).toEqual([{ ...waterGap, entryId: 'aus' }])
  })

  it('führt eine Lücke unter „Ausgeblendet“, auch wenn sie zugleich abgehakt ist', () => {
    const entries = [entry({ id: 'ab', status: 'erledigt' }), entry({ id: 'aus' })]

    expect(splitGaps([waterGap], entries, today).hidden).toEqual([{ ...waterGap, entryId: 'aus' }])
  })
})
