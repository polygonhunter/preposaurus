import { describe, expect, it } from 'vitest'
import { searchFoodTypes } from './food-type-search'

const foodType = (
  key: string,
  name: string,
  [categoryName, productGroupName] = ['Sonstiges', 'Sonstiges'],
) => ({
  id: key,
  key,
  name,
  categoryName,
  productGroupName,
})

const LIST = [
  foodType('bulgur', 'Bulgur', ['Nudeln, Reis und Getreide', 'Sonstiges']),
  foodType('instantnudeln', 'Instantnudeln', ['Fertiggerichte', 'Sonstiges']),
  foodType('nudeln', 'Nudeln', ['Nudeln, Reis und Getreide', 'Sonstiges']),
  foodType('nudeln_frisch', 'Frische Nudeln (gekühlt)', ['Nudeln, Reis und Getreide', 'Sonstiges']),
  foodType('aepfel', 'Äpfel', ['Frisches Obst', 'Obst']),
  foodType('kohl', 'Weißkohl', ['Gemüse', 'Sonstiges']),
  foodType('knaeckebrot', 'Knäckebrot', ['Brot', 'Sonstiges']),
  foodType('wasser_geschmack', 'Wasser mit Geschmack', ['Wasser', 'Sonstiges']),
  foodType('stilles_wasser', 'Stilles Wasser', ['Wasser', 'Sonstiges']),
  foodType('spargel', 'Spargel', ['Gemüse', 'Sonstiges']),
  foodType('tomaten_konserve', 'Tomaten (Konserve, stückig oder passiert)', [
    'Gemüsekonserven',
    'Sonstiges',
  ]),
  foodType('oliven', 'Oliven', ['Gemüsekonserven', 'Sonstiges']),
  foodType('brokkoli', 'Brokkoli', ['Gemüse', 'Sonstiges']),
  foodType('speiseoel', 'Speiseöl (Raps, Sonnenblume)', ['Öle', 'Fette und Öle']),
]

const names = (query: string, recentIds: readonly string[] = []) =>
  searchFoodTypes(LIST, query, { recentIds }).map((type) => type.name)

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

  it('findet ohne Umlaut, mit ae und mit ss', () => {
    expect(names('apfel')).toEqual(['Äpfel'])
    expect(names('aepfel')).toEqual(['Äpfel'])
    expect(names('knaecke')).toEqual(['Knäckebrot'])
    expect(names('weiss')).toEqual(['Weißkohl'])
  })

  it('findet über Kategorie und Warengruppe', () => {
    expect(names('obst')).toEqual(['Äpfel'])
  })

  it('findet Sorten und Alltagsnamen über die Suchwörter (#212)', () => {
    expect(names('Spaghetti')).toEqual(['Nudeln'])
    expect(names('spagh')).toEqual(['Nudeln'])
    expect(names('Dosentomaten')).toEqual(['Tomaten (Konserve, stückig oder passiert)'])
  })

  it('findet mehrere Wörter auch einzeln', () => {
    expect(names('stilles wasser')).toEqual(['Stilles Wasser'])
    expect(names('wasser stilles')).toEqual(['Stilles Wasser'])
    expect(names('nudeln xylophon')).toEqual([])
  })

  it('stellt Namen vor Suchwörter mit demselben Anfang', () => {
    expect(names('spa')).toEqual(['Spargel', 'Nudeln'])
  })

  it('stellt das genaue Suchwort vor einen Namensanfang', () => {
    expect(names('wasser').slice(0, 2)).toEqual(['Stilles Wasser', 'Wasser mit Geschmack'])
  })

  it('trifft mit kurzen Eingaben nur Wortanfänge', () => {
    expect(names('Öl')).toEqual(['Speiseöl (Raps, Sonnenblume)', 'Oliven'])
    expect(names('oel')).not.toContain('Brokkoli')
  })

  it('stellt bei gleichem Rang zuletzt genutzte Arten vorn', () => {
    expect(names('nudel', ['nudeln_frisch'])).toEqual(names('nudel'))
    expect(names('wasser', ['wasser_geschmack'])[0]).toBe('Stilles Wasser')
    expect(names('Öl', ['oliven'])).toEqual(['Speiseöl (Raps, Sonnenblume)', 'Oliven'])
  })

  it('liefert alle Treffer, gekürzt wird erst in der Anzeige', () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      foodType(`art_${String(index)}`, 'Bohnen'),
    )

    expect(searchFoodTypes(many, 'bohnen')).toHaveLength(12)
  })

  it('liefert nichts, wenn nichts passt', () => {
    expect(names('xylophon')).toEqual([])
  })
})

describe('eigene Suchwörter (#126)', () => {
  it('findet eine eigene Art über ihr Suchwort', () => {
    const own = {
      ...foodType('eigen_dinkelpops', 'Dinkelpops'),
      searchTerms: ['Frühstücksknusper'],
    }

    expect(searchFoodTypes([...LIST, own], 'knusper').map((type) => type.key)).toEqual([
      'eigen_dinkelpops',
    ])
  })
})
