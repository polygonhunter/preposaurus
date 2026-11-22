import { describe, expect, it } from 'vitest'
import { canonicalizeEnums } from './canonical-enums'
import { outputJsonSchema } from './output-schema'
import { retryDelayFromHeader } from './retry-after'

const packagingSchema = outputJsonSchema({
  role: 'verpackung',
  context: { foodTypes: [{ key: 'spaghetti', name: 'Spaghetti' }] },
})

describe('canonicalizeEnums', () => {
  it('bringt Enum-Werte in die Schreibweise des Schemas, auch verschachtelt und nullable', () => {
    const raw = {
      bezeichnung: 'Spaghetti',
      lebensmittelart: 'Spaghetti',
      behaelter: 'PACKUNG',
      inhalt: { wert: 500, einheit: 'G' },
      abtropfgewicht_g: null,
      sicherheit: 'Niedrig',
    }

    expect(canonicalizeEnums(packagingSchema, raw)).toEqual({
      bezeichnung: 'Spaghetti',
      lebensmittelart: 'spaghetti',
      behaelter: 'packung',
      inhalt: { wert: 500, einheit: 'g' },
      abtropfgewicht_g: null,
      sicherheit: 'niedrig',
    })
  })

  it('lässt Freitext und unbekannte Werte unverändert, damit das Schema sie prüft', () => {
    const schema = outputJsonSchema({ role: 'mhd', context: {} })
    const raw = { roh_text: 'MHD 08/2027', genauigkeit: 'Woche', extra: 'X' }

    expect(canonicalizeEnums(schema, raw)).toEqual(raw)
  })

  it('übergeht Antworten, die kein Objekt sind', () => {
    expect(canonicalizeEnums(packagingSchema, null)).toBeNull()
    expect(canonicalizeEnums(packagingSchema, [1])).toEqual([1])
  })
})

describe('retryDelayFromHeader', () => {
  const now = Date.parse('2026-11-22T10:00:00Z')

  it('liest Sekunden', () => {
    expect(retryDelayFromHeader('2', now)).toBe(2_000)
  })

  it('liest ein HTTP-Datum', () => {
    expect(retryDelayFromHeader('Sun, 22 Nov 2026 10:00:03 GMT', now)).toBe(3_000)
  })

  it('deckelt auf 5 Sekunden', () => {
    expect(retryDelayFromHeader('Sun, 22 Nov 2026 11:00:00 GMT', now)).toBe(5_000)
  })

  it.each([null, undefined, '', 'bald', '0', 'Sun, 22 Nov 2026 09:00:00 GMT'])(
    'nimmt 1 Sekunde für %s',
    (value) => {
      expect(retryDelayFromHeader(value, now)).toBe(1_000)
    },
  )
})
