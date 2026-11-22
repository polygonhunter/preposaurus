import { describe, expect, it } from 'vitest'
import {
  calculateHouseholdTargets,
  resolveDiet,
  targetsForDiet,
  type Diet,
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
  { groupKey: 'pflanzendrink', unit: 'ml', amountPerPersonPerDay: 0 },
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
      to: [{ groupKey: 'pflanzendrink', share: 1 }],
    },
  ],
}

/** Summe je Einheit, damit g und ml nie zusammengezählt werden. */
function totalsByUnit(amounts: ReadonlyMap<string, number>) {
  const totals = { g: 0, ml: 0 }
  for (const target of TEST_TARGETS) totals[target.unit] += amounts.get(target.groupKey) ?? 0
  return totals
}

function amounts(members: HouseholdMember[], householdDiet: Diet = 'omnivore') {
  const result = calculateHouseholdTargets({
    members,
    householdDiet,
    targets: TEST_TARGETS,
    dietShifts: TEST_SHIFTS,
    days: 10,
  })
  if (!result.ok) throw new Error('Verteilung ungültig')
  return Object.fromEntries(result.value.map((target) => [target.groupKey, target.amount]))
}

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
    'hält bei %s die Gesamtmenge je Einheit gleich',
    (diet) => {
      const shifted = totalsByUnit(targetsForDiet(TEST_TARGETS, TEST_SHIFTS[diet]))
      const original = totalsByUnit(targetsForDiet(TEST_TARGETS, []))
      expect(shifted.g).toBeCloseTo(original.g)
      expect(shifted.ml).toBeCloseTo(original.ml)
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
    expect(result['pflanzendrink']).toBe(3000)
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
      pflanzendrink: 0,
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

describe('calculateHouseholdTargets mit fehlerhaften Verteilungsdaten', () => {
  const run = (dietShifts: DietShifts) =>
    calculateHouseholdTargets({
      members: [{ type: 'adult', diet: 'vegan' }],
      householdDiet: 'omnivore',
      targets: TEST_TARGETS,
      dietShifts,
      days: 10,
    })
  const withVegan = (vegan: DietShifts['vegan']): DietShifts => ({ ...TEST_SHIFTS, vegan })

  it('lehnt einen Zielschlüssel ohne Zielmenge ab, statt Menge zu verlieren', () => {
    const shifts = withVegan([{ from: 'milch', to: [{ groupKey: 'unbekannt', share: 1 }] }])
    expect(run(shifts)).toEqual({
      ok: false,
      error: { kind: 'unknown-group', groupKey: 'unbekannt' },
    })
  })

  it('lehnt eine unbekannte Ausgangsgruppe ab', () => {
    const shifts = withVegan([{ from: 'eier', to: [{ groupKey: 'gemuese', share: 1 }] }])
    expect(run(shifts)).toEqual({ ok: false, error: { kind: 'unknown-group', groupKey: 'eier' } })
  })

  it('lehnt Anteile ab, die nicht 1 ergeben', () => {
    const shifts = withVegan([{ from: 'fleisch', to: [{ groupKey: 'gemuese', share: 0.9 }] }])
    expect(run(shifts)).toEqual({
      ok: false,
      error: { kind: 'shares-not-one', from: 'fleisch', sum: 0.9 },
    })
  })

  it('lehnt eine Verschiebung zwischen g und ml ab', () => {
    const shifts = withVegan([{ from: 'milch', to: [{ groupKey: 'gemuese', share: 1 }] }])
    expect(run(shifts)).toEqual({
      ok: false,
      error: { kind: 'mixed-units', from: 'milch', to: 'gemuese' },
    })
  })

  it('prüft auch Verteilungen, die gerade niemand im Haushalt nutzt', () => {
    const shifts = { ...TEST_SHIFTS, vegetarian: [{ from: 'x', to: [] }] }
    expect(run(shifts).ok).toBe(false)
  })
})
