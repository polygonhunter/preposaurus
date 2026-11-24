import { describe, expect, it } from 'vitest'
import { findSimilarFoodType } from './similar-food-type'

const FOOD_TYPES = [
  { key: 'nudeln', name: 'Nudeln' },
  { key: 'h_milch', name: 'H-Milch' },
  { key: 'knaeckebrot', name: 'Knäckebrot' },
  { key: 'eigen_graupen', name: 'Graupen', searchTerms: ['Rollgerste', 'Kochgerste'] },
]

const keyOf = (name: string) => findSimilarFoodType(FOOD_TYPES, name)?.key ?? null

describe('findSimilarFoodType', () => {
  it('findet denselben Namen ohne Rücksicht auf Groß- und Kleinschreibung', () => {
    expect(keyOf('nudeln')).toBe('nudeln')
    expect(keyOf('  NUDELN ')).toBe('nudeln')
    expect(keyOf('h-milch')).toBe('h_milch')
  })

  it('setzt Umlaute und ihre Umschreibung gleich', () => {
    expect(keyOf('Knaeckebrot')).toBe('knaeckebrot')
  })

  it('findet Suchwörter der Startliste und eigene Suchwörter (#212, #234)', () => {
    expect(keyOf('Spaghetti')).toBe('nudeln')
    expect(keyOf('penne')).toBe('nudeln')
    expect(keyOf('Milch')).toBe('h_milch')
    expect(keyOf('kochgerste')).toBe('eigen_graupen')
  })

  it('zieht einen gleichen Namen einem gleichen Suchwort vor', () => {
    const foodTypes = [
      { key: 'eigen_a', name: 'Basis', searchTerms: ['Zwieback'] },
      { key: 'zwieback', name: 'Zwieback' },
    ]

    expect(findSimilarFoodType(foodTypes, 'zwieback')?.key).toBe('zwieback')
  })

  it('meldet nur Gleichheit, keine Teilwörter, und nichts bei leerem Namen', () => {
    expect(keyOf('Dinkelnudeln')).toBeNull()
    expect(keyOf('Nudel')).toBeNull()
    expect(keyOf('   ')).toBeNull()
  })
})
