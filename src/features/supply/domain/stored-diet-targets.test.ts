import { describe, expect, it } from 'vitest'
import type { GroupTarget, HouseholdMember } from './group-targets'
import { calculateStoredDietTargets } from './stored-diet-targets'

// TESTDATEN: frei gewählte Mengen je Person und Tag, nicht die geprüften Quellwerte
const omnivore: GroupTarget[] = [
  { groupKey: 'getreide', unit: 'g', amountPerPersonPerDay: 100 },
  { groupKey: 'fleisch', unit: 'g', amountPerPersonPerDay: 50 },
]
const vegetarian: GroupTarget[] = [
  { groupKey: 'getreide', unit: 'g', amountPerPersonPerDay: 120 },
  { groupKey: 'fleisch', unit: 'g', amountPerPersonPerDay: 0 },
]

const adult: HouseholdMember = { type: 'adult', diet: null }
const vegetarianChild: HouseholdMember = { type: 'child', diet: 'vegetarian' }

const amounts = (targets: ReturnType<typeof calculateStoredDietTargets>) =>
  targets.map((target) => [target.groupKey, target.amount])

describe('calculateStoredDietTargets', () => {
  it('rechnet jede Person nach ihrer Ernährungsform und summiert', () => {
    const targets = calculateStoredDietTargets(
      {
        members: [adult, vegetarianChild, { type: 'baby', diet: null }],
        householdDiet: 'omnivore',
        targetsByDiet: { omnivore, vegetarian },
      },
      10,
    )

    expect(amounts(targets)).toEqual([
      ['getreide', 2200],
      ['fleisch', 500],
    ])
  })

  it('nimmt „alles“, wenn für eine Form keine Werte gespeichert sind', () => {
    const targets = calculateStoredDietTargets(
      { members: [adult], householdDiet: 'vegan', targetsByDiet: { omnivore } },
      2,
    )

    expect(amounts(targets)).toEqual([
      ['getreide', 200],
      ['fleisch', 100],
    ])
  })

  it('bleibt ohne gespeicherte Werte oder ohne Mitglieder leer', () => {
    expect(
      calculateStoredDietTargets(
        { members: [adult], householdDiet: 'omnivore', targetsByDiet: {} },
        10,
      ),
    ).toEqual([])
    expect(
      calculateStoredDietTargets(
        { members: [], householdDiet: 'omnivore', targetsByDiet: { omnivore } },
        10,
      ),
    ).toEqual([])
  })
})
