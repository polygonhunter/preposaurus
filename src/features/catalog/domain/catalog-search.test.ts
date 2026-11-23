import { describe, expect, it } from 'vitest'
import { filterFoodTypes } from './catalog-search'

const entry = (name: string, categoryName: string, searchTerms: string[] = []) => ({
  name,
  categoryName,
  searchTerms,
})

const LIST = [
  entry('Nudeln', 'Nudeln, Reis und Getreide'),
  entry('Dinkelpops', 'Frühstück', ['Knusperflocken']),
  entry('Äpfel', 'Frisches Obst'),
]

describe('filterFoodTypes', () => {
  it('findet über Namen, Kategorie und eigene Suchwörter', () => {
    expect(filterFoodTypes(LIST, 'nudel').map((item) => item.name)).toEqual(['Nudeln'])
    expect(filterFoodTypes(LIST, 'obst').map((item) => item.name)).toEqual(['Äpfel'])
    expect(filterFoodTypes(LIST, 'knusper').map((item) => item.name)).toEqual(['Dinkelpops'])
  })

  it('ignoriert Umlaute und verlangt jedes Wort', () => {
    expect(filterFoodTypes(LIST, 'aepfel obst')).toHaveLength(1)
    expect(filterFoodTypes(LIST, 'aepfel reis')).toHaveLength(0)
  })

  it('liefert bei leerer Suche nichts', () => {
    expect(filterFoodTypes(LIST, '  ')).toEqual([])
  })
})
