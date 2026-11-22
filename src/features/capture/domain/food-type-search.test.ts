import { describe, expect, it } from 'vitest'
import { normalizeSearchText, searchFoodTypes } from './food-type-search'

const foodType = (name: string, categoryName = 'Sonstiges', productGroupName = 'Sonstiges') => ({
  name,
  categoryName,
  productGroupName,
})

const LIST = [
  foodType('Bulgur', 'Nudeln, Reis und Getreide'),
  foodType('Instantnudeln', 'Fertiggerichte'),
  foodType('Nudeln', 'Nudeln, Reis und Getreide'),
  foodType('Frische Nudeln (gekühlt)', 'Nudeln, Reis und Getreide'),
  foodType('Äpfel, getrocknet', 'Trockenobst', 'Obst'),
  foodType('Weißkohl', 'Gemüse'),
]

const names = (query: string, limit = 10) => searchFoodTypes(LIST, query, limit).map((t) => t.name)

describe('normalizeSearchText', () => {
  it('ignoriert Groß- und Kleinschreibung, Umlaute, ß und Leerraum', () => {
    expect(normalizeSearchText('  Äpfel ')).toBe('apfel')
    expect(normalizeSearchText('Weißkohl')).toBe('weisskohl')
  })
})

describe('searchFoodTypes', () => {
  it('liefert ohne Suchtext nichts', () => {
    expect(names('  ')).toEqual([])
  })

  it('zeigt Namensanfang vor Wortanfang vor Teilwort vor Treffer im Pfad', () => {
    expect(names('nudel')).toEqual([
      'Nudeln',
      'Frische Nudeln (gekühlt)',
      'Instantnudeln',
      'Bulgur',
    ])
  })

  it('findet ohne Umlaut und mit ss', () => {
    expect(names('apfel')).toEqual(['Äpfel, getrocknet'])
    expect(names('weiss')).toEqual(['Weißkohl'])
  })

  it('findet über Kategorie und Warengruppe', () => {
    expect(names('obst')).toEqual(['Äpfel, getrocknet'])
  })

  it('kürzt auf die Höchstzahl', () => {
    expect(names('nudel', 2)).toEqual(['Nudeln', 'Frische Nudeln (gekühlt)'])
  })

  it('liefert nichts, wenn nichts passt', () => {
    expect(names('spaghetti')).toEqual([])
  })
})
