import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { createFakeStockReader, product, unit } from '../../../../tests/helpers/fake-stock-reader'
import { countDuePackages } from './count-due-packages'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'

describe('countDuePackages', () => {
  it('zählt alle Packungen von Bald fällig, ohne „Datum fehlt“ und später Fälliges', async () => {
    const reader = createFakeStockReader({
      householdId,
      products: [product({ id: 'nudeln' })],
      units: [
        unit('nudeln', '2026-11-20'),
        unit('nudeln', '2026-11-25'),
        unit('nudeln', '2026-11-25'),
        unit('nudeln', '2027-01-20'),
        unit('nudeln', '2028-06-30'),
        unit('nudeln', null),
        unit('nudeln', '2026-11-25', { status: 'consumed' }),
      ],
    })

    expect(await countDuePackages(reader, { householdId, today })).toBe(4)
  })

  it('liefert 0 ohne fällige Packungen', async () => {
    const reader = createFakeStockReader({ householdId, products: [], units: [] })

    expect(await countDuePackages(reader, { householdId, today })).toBe(0)
  })
})
