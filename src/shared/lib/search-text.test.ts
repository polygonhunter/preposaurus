import { describe, expect, it } from 'vitest'
import { normalizeSearchText } from './search-text'

describe('normalizeSearchText', () => {
  it('ignoriert Groß- und Kleinschreibung, Umlaute, ß und Leerraum', () => {
    expect(normalizeSearchText('  Äpfel ')).toBe('apfel')
    expect(normalizeSearchText('Weißkohl')).toBe('weisskohl')
  })

  it('liest ae, oe und ue wie Umlaute', () => {
    expect(normalizeSearchText('Knaecke')).toBe(normalizeSearchText('Knäcke'))
    expect(normalizeSearchText('Oel')).toBe(normalizeSearchText('Öl'))
    expect(normalizeSearchText('Gemuese')).toBe(normalizeSearchText('Gemüse'))
  })
})
