import { describe, expect, it } from 'vitest'
import {
  calculateHouseholdTargets,
  resolveDiet,
  targetsForDiet,
  type DietShifts,
  type GroupTarget,
  type HouseholdMember,
} from './group-targets'

// TESTDATEN, keine Quellwerte (BBK/BLE-Werte kommen geprüft als Seed, U3).
const TEST_TARGETS: GroupTarget[] = [
  { groupKey: 'getreide', unit: 'g', amountPerPersonPerDay: 100 },
  { groupKey: 'gemuese', unit: 'g', amountPerPersonPerDay: 200 },
  { groupKey: 'obst', unit: 'g', amountPerPersonPerDay: 80 },
  { groupKey: 'fleisch', unit: 'g', amountPerPersonPerDay: 60 },
  { groupKey: 'milch', unit: 'ml', amountPerPersonPerDay: 300 },
  { groupKey: 'wasser', unit: 'ml', amountPerPersonPerDay: 2000 },
]

// TESTDATEN: Verteilung nach Ernährungsform, frei gewählt
const TEST_SHIFTS: DietShifts = {
  omnivore: [],
  vegetarian: [
    {
      from: 'fleisch',
      to: [
        { groupKey: 'gemuese', share: 2 / 3 },
        { groupKey: 'obst', share: 1 / 3 },
      ],
    },
  ],
  vegan: [
    {
      from: 'fleisch',
      to: [
        { groupKey: 'gemuese', share: 2 / 3 },
        { groupKey: 'obst', share: 1 / 3 },
      ],
    },
    {
      from: 'milch',
      to: [
        { groupKey: 'gemuese', share: 1 / 2 },
        { groupKey: 'obst', share: 1 / 2 },
      ],
    },
  ],
}

const sum = (values: Iterable<number>) => [...values].reduce((total, value) => total + value, 0)
const amounts = (members: HouseholdMember[], householdDiet: HouseholdMember['diet'] = 'omnivore') =>
  Object.fromEntries(
    calculateHouseholdTargets({
      members,
      householdDiet: householdDiet ?? 'omnivore',
      targets: TEST_TARGETS,
      dietShifts: TEST_SHIFTS,
      days: 10,
    }).map((target) => [target.groupKey, target.amount]),
  )

describe('targetsForDiet', () => {
  it('lässt bei „alles“ die Mengen der Quelle unverändert', () => {
    expect(targetsForDiet(TEST_TARGETS, TEST_SHIFTS.omnivore).get('fleisch')).toBe(60)
  })

  it('verschiebt bei vegetarisch Fleisch auf andere Gruppen', () => {
    const vegetarian = targetsForDiet(TEST_TARGETS, TEST_SHIFTS.vegetarian)

    expect(vegetarian.get('fleisch')).toBe(0)
    expect(vegetarian.get('gemuese')).toBeCloseTo(240)
    expect(vegetarian.get('obst')).toBeCloseTo(100)
  })

  it.each(['omnivore', 'vegetarian', 'vegan'] as const)(
    'hält bei %s die Gesamtmenge gleich',
    (diet) => {
      const total = sum(targetsForDiet(TEST_TARGETS, TEST_SHIFTS[diet]).values())
      expect(total).toBeCloseTo(sum(TEST_TARGETS.map((target) => target.amountPerPersonPerDay)))
    },
  )
})

describe('calculateHouseholdTargets', () => {
  it('rechnet je Person und summiert im gemischten Haushalt', () => {
    const result = amounts([
      { type: 'adult', diet: null },
      { type: 'adult', diet: null },
      { type: 'adult', diet: 'vegetarian' },
    ])

    expect(result['getreide']).toBeCloseTo(3000)
    expect(result['gemuese']).toBeCloseTo(6400)
    expect(result['obst']).toBeCloseTo(2600)
    expect(result['fleisch']).toBeCloseTo(1200)
    expect(result['milch']).toBeCloseTo(9000)
    expect(result['wasser']).toBeCloseTo(60000)
  })

  it('nimmt für Mitglieder ohne eigene Angabe den Haushalts-Standard', () => {
    const result = amounts([{ type: 'adult', diet: null }], 'vegan')

    expect(result['fleisch']).toBe(0)
    expect(result['milch']).toBe(0)
  })

  it('zählt ein Baby nicht in die Zielmengen', () => {
    const result = amounts([
      { type: 'adult', diet: null },
      { type: 'baby', diet: null },
    ])

    expect(result['getreide']).toBe(1000)
  })

  it('liefert Ziel 0 für einen Haushalt ohne Mitglieder', () => {
    expect(amounts([])).toEqual({
      getreide: 0,
      gemuese: 0,
      obst: 0,
      fleisch: 0,
      milch: 0,
      wasser: 0,
    })
  })
})

describe('resolveDiet', () => {
  it('nimmt die eigene Angabe vor dem Haushalts-Standard', () => {
    expect(resolveDiet({ type: 'adult', diet: 'vegan' }, 'omnivore')).toBe('vegan')
    expect(resolveDiet({ type: 'adult', diet: null }, 'vegetarian')).toBe('vegetarian')
  })
})
