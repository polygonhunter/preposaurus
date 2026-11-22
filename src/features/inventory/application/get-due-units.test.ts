import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { dueSortSchema } from '../schemas'
import {
  createFakeStockReader,
  product,
  spaghettiType,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { getDueUnits } from './get-due-units'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'
const cellar = { id: 'lager-keller', name: 'Keller' }
const kitchen = { id: 'lager-kueche', name: 'Küche' }

const milk = product({
  id: 'milch',
  name: 'H-Milch',
  foodType: { ...spaghettiType, id: 'art-milch', name: 'H-Milch' },
  storageLocation: kitchen,
})

const reader = createFakeStockReader({
  householdId,
  products: [product({ id: 'nudeln', storageLocation: cellar }), milk],
  units: [
    unit('nudeln', '2026-11-20'),
    unit('nudeln', '2026-11-19', { checkedAt: '2026-11-21' }),
    unit('milch', '2026-11-21', { kind: 'use-by' }),
    unit('nudeln', '2026-11-25'),
    unit('nudeln', '2026-11-25'),
    unit('milch', '2026-11-25'),
    unit('nudeln', '2026-12-15'),
    unit('milch', '2027-01-20'),
    unit('nudeln', '2027-06-30'),
    unit('nudeln', null),
    unit('nudeln', '2026-11-25', { status: 'consumed' }),
  ],
})

describe('getDueUnits', () => {
  it('zählt Packungen je Zeitgruppe, „Datum fehlt“ eigens, später fällig nicht', async () => {
    const due = await getDueUnits(reader, { householdId, today, sort: 'date' })

    expect(due.counts).toEqual({
      expired: 2,
      'this-week': 3,
      'this-month': 1,
      'next-three-months': 1,
      'no-date': 1,
    })
    expect(due.groups.map((group) => group.group)).toEqual([
      'expired',
      'this-week',
      'this-month',
      'next-three-months',
      'no-date',
    ])
  })

  it('bündelt je Lebensmittelart und Datum, frühestes Datum zuerst', async () => {
    const due = await getDueUnits(reader, { householdId, today, sort: 'date' })
    const thisWeek = due.groups.find((group) => group.group === 'this-week')

    expect(thisWeek?.entries.map((entry) => [entry.name, entry.unitIds.length])).toEqual([
      ['H-Milch', 1],
      ['Spaghetti', 2],
    ])
    expect(thisWeek?.entries[1]).toMatchObject({
      daysLeft: 3,
      productNames: ['Spaghetti'],
      storageLocations: ['Keller'],
      canConfirmStillGood: false,
    })
  })

  it('bietet „Noch gut“ nur bei abgelaufenem MHD an, nie beim Verbrauchsdatum', async () => {
    const due = await getDueUnits(reader, { householdId, today, sort: 'date' })
    const expired = due.groups.find((group) => group.group === 'expired')?.entries ?? []

    expect(expired.map((entry) => [entry.name, entry.kind, entry.canConfirmStillGood])).toEqual([
      ['Spaghetti', 'best-before', true],
      ['H-Milch', 'use-by', false],
    ])
  })

  it('sortiert auf Wunsch nach Lagerort', async () => {
    const sort = dueSortSchema.parse('location')
    const due = await getDueUnits(reader, { householdId, today, sort })
    const thisWeek = due.groups.find((group) => group.group === 'this-week')

    expect(thisWeek?.entries.map((entry) => entry.storageLocations[0])).toEqual(['Keller', 'Küche'])
  })

  it('liefert einem fremden Haushalt keine Einträge', async () => {
    const due = await getDueUnits(reader, { householdId: 'haushalt-b', today, sort: 'date' })

    expect(due.groups).toEqual([])
  })
})
