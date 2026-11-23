// Die Suchwörter der Lebensmittelarten (#212) hängen am Schlüssel aus dem Seed. Ein Tippfehler im
// Schlüssel würde die Suchwörter still wirkungslos machen. Dazu die Suche gegen die echte Startliste.
import { describe, expect, it } from 'vitest'
import {
  MERGED_FOOD_TYPES,
  SYSTEM_FOOD_TYPES,
} from '../../../db/seeds/stammdaten/lebensmittelarten'
import { FOOD_TYPE_SEARCH_TERMS } from '../../../src/features/capture/domain/food-type-search-terms'
import { searchFoodTypes } from '../../../src/features/capture/domain/food-type-search'

const SYSTEM_KEYS = new Set(SYSTEM_FOOD_TYPES.map((foodType) => foodType.key))

const choices = SYSTEM_FOOD_TYPES.map((foodType) => ({
  id: foodType.key,
  key: foodType.key,
  name: foodType.name,
  categoryName: foodType.category,
  productGroupName: '',
}))

const firstHit = (query: string) => searchFoodTypes(choices, query)[0]?.key

describe('Suchwörter der Lebensmittelarten (#212)', () => {
  it('nutzt nur Schlüssel, die es in der Startliste gibt', () => {
    const unknown = Object.keys(FOOD_TYPE_SEARCH_TERMS).filter((key) => !SYSTEM_KEYS.has(key))

    expect(unknown).toEqual([])
  })

  it('findet zusammengelegte Arten der ersten Startliste unter ihrem alten Namen', () => {
    for (const [oldKey, newKey] of Object.entries(MERGED_FOOD_TYPES)) {
      const found = searchFoodTypes(choices, oldKey.replaceAll('_', ' '))
      expect(
        found.map((hit) => hit.key),
        oldKey,
      ).toContain(newKey)
    }
  })

  it('trifft die Alltagswörter aus dem Testlauf zuerst', () => {
    expect(firstHit('Spaghetti')).toBe('nudeln')
    expect(firstHit('Dosentomaten')).toBe('tomaten_konserve')
    expect(firstHit('knaecke')).toBe('knaeckebrot')
    expect(firstHit('wasser')).toBe('stilles_wasser')
    expect(firstHit('Öl')).toBe('speiseoel')
    expect(firstHit('nudel')).toBe('nudeln')
    expect(firstHit('reis')).toBe('reis')
  })
})
