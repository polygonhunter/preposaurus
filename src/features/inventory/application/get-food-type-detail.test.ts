import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  createFakeStockReader,
  product,
  reisCategory,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { getFoodTypeDetail } from './get-food-type-detail'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'

// Ohne Nährwerttabelle: kcal und Makros kommen live aus dem Richtwert der Lebensmittelart
const withoutLabel = product({
  id: 'nudeln-bio',
  name: 'Spaghetti Bio',
  content: { value: 1000, unit: 'g' },
  nutrition: {
    values: { kcal: null, protein: null, carbs: null, fat: null },
    source: null,
    confirmedAt: null,
  },
})

const checked = unit('nudeln-bio', '2026-11-20', { checkedAt: '2026-11-21' })

const reader = createFakeStockReader({
  householdId,
  products: [
    product({ id: 'nudeln' }),
    withoutLabel,
    product({ id: 'reis', name: 'Reis lose', foodType: null, category: reisCategory }),
  ],
  units: [
    unit('nudeln', '2027-09-30'),
    unit('nudeln', '2027-03-31'),
    unit('nudeln', '2027-09-30'),
    unit('nudeln', null),
    checked,
    unit('nudeln', '2026-01-01', { status: 'discarded' }),
  ],
})

const spaghetti = { kind: 'food-type', id: 'art-spaghetti' } as const

describe('getFoodTypeDetail', () => {
  it('liefert Pfad, Kennwerte und die früheste Packung für „1 entnehmen“', async () => {
    const result = await getFoodTypeDetail(reader, { householdId, today, target: spaghetti })
    if (!result.ok) throw new Error('nicht gefunden')

    expect(result.value).toMatchObject({
      name: 'Spaghetti',
      path: { group: { key: 'getreide' }, category: { id: 'kat-nudeln', name: 'Nudeln' } },
      typicalShelfLifeMonths: 24,
      totals: { packages: 4, uncountedPackages: 1, withoutDate: 1 },
      // Die geprüfte, abgelaufene Packung hat das früheste MHD und kommt zuerst dran
      fifoUnitId: checked.id,
    })
    expect(result.value.products.map((entry) => entry.name)).toEqual(['Spaghetti', 'Spaghetti Bio'])
  })

  it('gruppiert die Packungen nach Datum mit Zustand, ohne Datum zuletzt', async () => {
    const result = await getFoodTypeDetail(reader, { householdId, today, target: spaghetti })
    const groups = result.ok ? result.value.products[0]?.bestBeforeGroups : []

    expect(groups?.map((group) => [group.kind, group.units.length])).toEqual([
      ['dated', 1],
      ['dated', 2],
      ['no-date', 1],
    ])
    expect(groups?.[0]).toMatchObject({ date: '2027-03-31', state: 'good' })
  })

  it('zeigt eine „Noch gut“ geprüfte Gruppe als gut und nennt das Prüfdatum', async () => {
    const result = await getFoodTypeDetail(reader, { householdId, today, target: spaghetti })
    const [group] = result.ok ? (result.value.products[1]?.bestBeforeGroups ?? []) : []

    expect(group).toMatchObject({ kind: 'dated', state: 'good' })
    expect(group?.units).toEqual([{ id: checked.id, kind: 'best-before', checkedAt: '2026-11-21' }])
  })

  it('nennt die Herkunft der Nährwerte und ergänzt den Richtwert der Lebensmittelart', async () => {
    const result = await getFoodTypeDetail(reader, { householdId, today, target: spaghetti })
    const [label, reference] = result.ok ? result.value.products : []

    expect(label?.nutrition).toMatchObject({
      source: 'label',
      isConfirmed: true,
      isKcalEstimated: false,
      gap: null,
      perPackage: { kcal: 1795 },
    })
    expect(reference?.nutrition).toMatchObject({
      source: null,
      isConfirmed: false,
      isKcalEstimated: true,
      gap: 'no-label',
      per100: { kcal: { value: 350, origin: 'reference' } },
      perPackage: { kcal: 3500, fat: 15 },
    })
  })

  it('öffnet ein Produkt ohne Lebensmittelart über seine eigene Seite', async () => {
    const result = await getFoodTypeDetail(reader, {
      householdId,
      today,
      target: { kind: 'product', id: 'reis' },
    })

    expect(result.ok && result.value).toMatchObject({
      name: 'Reis lose',
      typicalShelfLifeMonths: null,
      fifoUnitId: null,
      totals: { packages: 0 },
    })
  })

  it('liefert not-found für einen fremden Haushalt', async () => {
    const result = await getFoodTypeDetail(reader, {
      householdId: 'haushalt-b',
      today,
      target: spaghetti,
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})
