import { describe, expect, it } from 'vitest'
import { fakeCatalog, foodType } from '../../../../tests/helpers/fake-catalog'
import { ownSiblingIds } from '../domain/category'
import { moveFoodType } from './food-types'

const HOUSEHOLD = 'h1'

const ENTRIES = [
  foodType('dinkel'),
  foodType('emmer'),
  foodType('linsen', { categoryId: 'huelsen' }),
  foodType('kamut'),
  foodType('nudeln', { isSystem: true }),
]

describe('Reihenfolge eigener Lebensmittelarten', () => {
  it('nennt die eigenen Arten derselben Kategorie in ihrer Reihenfolge', () => {
    expect(ownSiblingIds(ENTRIES, 'emmer')).toEqual(['dinkel', 'emmer', 'kamut'])
    expect(ownSiblingIds(ENTRIES, 'linsen')).toEqual(['linsen'])
  })

  it('lässt System-Arten und unbekannte Arten nicht rücken', () => {
    expect(ownSiblingIds(ENTRIES, 'nudeln')).toBeNull()
    expect(ownSiblingIds(ENTRIES, 'fremd')).toBeNull()
  })

  it('rückt eine eigene Art eine Stelle nach oben und speichert die Kategorie neu', async () => {
    const { deps, calls } = fakeCatalog([], ENTRIES)

    await moveFoodType(deps, { householdId: HOUSEHOLD, id: 'kamut', direction: 'up' })

    expect(calls).toEqual(['order-food-types:dinkel|kamut|emmer'])
  })

  it('ändert nichts am Rand, bei einer System-Art oder einer fremden ID', async () => {
    const { deps, calls } = fakeCatalog([], ENTRIES)

    await moveFoodType(deps, { householdId: HOUSEHOLD, id: 'dinkel', direction: 'up' })
    await moveFoodType(deps, { householdId: HOUSEHOLD, id: 'nudeln', direction: 'down' })
    await moveFoodType(deps, { householdId: HOUSEHOLD, id: 'fremd', direction: 'down' })

    expect(calls).toEqual([])
  })
})
