import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { unit } from '../../../../tests/helpers/fake-stock-reader'
import { createFakeUnitWriter } from '../../../../tests/helpers/fake-unit-writer'
import { markStillGood, undoStillGood } from './mark-still-good'

const householdId = 'haushalt-a'
const today = toCalendarDay('2026-11-23')

function setup() {
  const units = [
    unit('walnuesse', '2026-11-01'),
    unit('walnuesse', '2026-11-01'),
    unit('hackfleisch', '2026-11-20', { kind: 'use-by' }),
    unit('nudeln', '2027-03-31'),
    unit('thunfisch', '2026-10-01', { checkedAt: '2026-11-10' }),
  ]
  return { units, writer: createFakeUnitWriter({ householdId, units }) }
}

const idsOf = (units: readonly { id: string }[], ...indexes: number[]) =>
  indexes.map((index) => units[index]?.id ?? '')

describe('markStillGood („Noch gut“)', () => {
  it('setzt geprueft_am auf heute, die Packungen bleiben im Vorrat', async () => {
    const { units, writer } = setup()
    const unitIds = idsOf(units, 0, 1)

    const result = await markStillGood(writer, { householdId, unitIds, today })

    expect(result).toEqual({ ok: true, value: { unitIds, checkedAt: today } })
    expect(units.slice(0, 2).map((entry) => [entry.status, entry.checkedAt])).toEqual([
      ['stock', today],
      ['stock', today],
    ])
  })

  it('gibt es nicht beim Verbrauchsdatum, nicht vor Ablauf und nicht zweimal', async () => {
    const { units, writer } = setup()

    for (const index of [2, 3, 4]) {
      const result = await markStillGood(writer, {
        householdId,
        unitIds: idsOf(units, index),
        today,
      })
      expect(result).toEqual({ ok: false, error: { kind: 'not-applicable' } })
    }
    expect(units[4]?.checkedAt).toBe('2026-11-10')
  })

  it('kennt fremde Packungen nicht', async () => {
    const { units, writer } = setup()

    const result = await markStillGood(writer, {
      householdId: 'haushalt-b',
      unitIds: idsOf(units, 0),
      today,
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(units[0]?.checkedAt).toBeNull()
  })
})

describe('undoStillGood (Rückgängig nach „Noch gut“)', () => {
  it('nimmt die eben gesetzte Prüfung zurück, eine ältere bleibt', async () => {
    const { units, writer } = setup()
    const unitIds = idsOf(units, 0, 4)
    await markStillGood(writer, { householdId, unitIds, today })

    await undoStillGood(writer, { householdId, unitIds, checkedAt: today })

    expect(units[0]?.checkedAt).toBeNull()
    expect(units[4]?.checkedAt).toBe('2026-11-10')
  })

  it('ändert in einem fremden Haushalt nichts', async () => {
    const { units, writer } = setup()
    const unitIds = idsOf(units, 0)
    await markStillGood(writer, { householdId, unitIds, today })

    await undoStillGood(writer, { householdId: 'haushalt-b', unitIds, checkedAt: today })

    expect(units[0]?.checkedAt).toBe(today)
  })
})
