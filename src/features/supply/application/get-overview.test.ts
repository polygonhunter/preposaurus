import { describe, expect, it } from 'vitest'
import type { SupplyBasis } from '@/features/supply/domain/supply-basis'
import { toCalendarDay } from '@/shared/lib/dates'
import { createFakeHouseholdFacts } from '../../../../tests/helpers/fake-household-facts'
import {
  SETTINGS,
  createFakeStockReader,
  product,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { overviewSchema } from '../schemas'
import { getOverview } from './get-overview'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'

// TESTDATEN: 1 Erwachsener, 2.000 kcal und 2 l je Tag, Ziel 10 Tage, frei gewählte Zielmengen
const basis: SupplyBasis = {
  members: [{ type: 'adult', diet: null }],
  householdDiet: 'omnivore',
  needs: { adult: { kcalPerDay: 2000, waterMlPerDay: 2000 } },
  targetsByDiet: {
    omnivore: [
      { groupKey: 'getreide', unit: 'g', amountPerPersonPerDay: 150 },
      { groupKey: 'wasser', unit: 'ml', amountPerPersonPerDay: 2000 },
    ],
  },
  goalDays: 10,
}

const water = product({
  id: 'wasser',
  name: 'Mineralwasser',
  content: { value: 6000, unit: 'ml' },
  nutrition: {
    values: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    source: 'label',
    confirmedAt: null,
  },
  foodType: null,
  category: { id: 'kat-wasser', name: 'Wasser', pictogram: null },
  group: { key: 'wasser', name: 'Wasser', shortName: 'Wasser' },
})

// 4 × Nudeln 500 g à 359 kcal/100 g = 7.180 kcal (3,5 Tage), 3 × 6 l Wasser = 18 l (9 Tage)
const stockUnits = () => [
  unit('nudeln', '2026-11-20'),
  unit('nudeln', '2026-11-25'),
  unit('nudeln', '2026-12-30'),
  unit('nudeln', '2028-01-31'),
  unit('nudeln', '2028-01-31'),
  unit('nudeln', null),
  unit('wasser', '2028-06-30'),
  unit('wasser', '2028-06-30'),
  unit('wasser', '2028-06-30'),
]

const goal = { days: 10, targetDay: toCalendarDay('2027-03-01') }
const source = {
  name: 'Beispielquelle',
  asOf: '2026',
  link: 'https://example.org/quelle',
  isVerified: false,
}

function ports(options: { basis?: SupplyBasis; units?: ReturnType<typeof stockUnits> } = {}) {
  return {
    stock: createFakeStockReader({
      householdId,
      products: [product({ id: 'nudeln' }), water],
      units: options.units ?? stockUnits(),
      settings: SETTINGS,
      basis: options.basis ?? basis,
    }),
    facts: createFakeHouseholdFacts({ householdId, goal, source, openRestockItems: 2 }),
  }
}

describe('getOverview', () => {
  it('liefert ein DTO, das zum Schema passt', async () => {
    const overview = await getOverview(ports(), { householdId, today })

    expect(overviewSchema.parse(overview)).toEqual(overview)
  })

  it('rechnet „Heute versorgt“ mit Engpass und zählt „Datum fehlt“ heute mit', async () => {
    const { supply, hasStock } = await getOverview(ports(), { householdId, today })

    // 5 haltbare Packungen (4 mit Datum, 1 ohne) = 8.975 kcal, die abgelaufene zählt nicht
    expect(hasStock).toBe(true)
    expect(supply).toEqual({
      days: 4.4,
      energyDays: 4.4,
      waterDays: 9,
      bottleneck: 'energy',
      isApproximate: false,
      explanation: {
        kcal: 8975,
        waterMl: 18000,
        kcalPerDay: 2000,
        waterMlPerDay: 2000,
        needLines: [{ type: 'adult', count: 1, kcalPerDay: 2000, waterMlPerDay: 2000 }],
        uncountedMembers: 0,
        estimatedShare: 0,
        packages: { expired: 1, stillGood: 0, missingDate: 1 },
        stillGoodCounts: false,
      },
    })
  })

  it('nennt den Stand am Zieldatum und die Packungen, die vorher ablaufen', async () => {
    const { goal: goalDto } = await getOverview(ports(), { householdId, today })

    // Am 01.03.2027 zählen nur die beiden Packungen bis 2028 (7.180 kcal ÷ 2 = 3.590 → 1,7 Tage)
    expect(goalDto).toEqual({
      days: 10,
      date: '2027-03-01',
      outlook: { kind: 'valid', days: 1.7, isReached: false, expiringPackages: 2 },
    })
  })

  it('nennt als nächsten Schritt die Fehlmenge des Engpasses bis zum Ziel', async () => {
    const { nextStep } = await getOverview(ports(), { householdId, today })

    expect(nextStep?.resource).toBe('energy')
    // Bedarf bis zum Ziel minus Bestand, nicht aus abgerundeten 4,4 Tagen (#214)
    expect(nextStep?.missing).toBe(10 * 2000 - 8975)
    expect(nextStep?.alsoMissing?.resource).toBe('water')
  })

  it('zeigt die drei dringendsten fälligen Einträge und zählt alle Packungen', async () => {
    const { due } = await getOverview(ports(), { householdId, today })

    expect(due.counts).toEqual({
      expired: 1,
      'this-week': 1,
      'this-month': 0,
      'next-three-months': 1,
    })
    expect(due.total).toBe(3)
    expect(due.entries.map((entry) => [entry.group, entry.date, entry.daysLeft])).toEqual([
      ['expired', '2026-11-20', -2],
      ['this-week', '2026-11-25', 3],
      ['next-three-months', '2026-12-30', 38],
    ])
    expect(due.entries[0]).toMatchObject({ name: 'Spaghetti', packages: 1, precision: 'day' })
  })

  it('zeigt Warengruppen ohne Wasser und markiert die knappste der gezeigten', async () => {
    const { groups } = await getOverview(ports(), { householdId, today })

    // 5 haltbare Packungen à 500 g gegen 150 g × 10 Tage
    expect(groups).toEqual([
      {
        key: 'getreide',
        name: 'Getreide',
        shortName: 'Getreide',
        days: 16.6,
        goalDays: 10,
        isTightest: true,
      },
    ])
  })

  it('zählt Ziel-Lücke und offene Nachkauf-Einträge, nennt Haushalt und Quelle', async () => {
    const { restock, household } = await getOverview(ports(), { householdId, today })

    expect(restock).toEqual({ openItems: 2, gapGroups: 2 })
    expect(household).toEqual({ members: 1, source })
  })

  it('liefert ohne Bedarf keine Tage, aber Bald fällig und das Ziel', async () => {
    const noNeed = { ...basis, members: [], needs: {} }
    const overview = await getOverview(ports({ basis: noNeed }), { householdId, today })

    expect(overview.supply).toBeNull()
    expect(overview.nextStep).toBeNull()
    expect(overview.goal).toEqual({ days: 10, date: '2027-03-01', outlook: null })
    expect(overview.due.total).toBe(3)
  })

  it('meldet einen leeren Vorrat', async () => {
    const overview = await getOverview(ports({ units: [] }), { householdId, today })

    expect(overview.hasStock).toBe(false)
    expect(overview.supply).toMatchObject({ days: 0, bottleneck: 'water' })
    expect(overview.due).toMatchObject({ total: 0, entries: [] })
  })

  it('liefert für einen fremden Haushalt nichts aus dem eigenen', async () => {
    const overview = await getOverview(ports(), { householdId: 'haushalt-b', today })

    expect(overview.hasStock).toBe(false)
    expect(overview.goal).toBeNull()
    expect(overview.household).toEqual({ members: 0, source: null })
    expect(overview.restock.openItems).toBe(0)
  })
})
