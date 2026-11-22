import { describe, expect, it } from 'vitest'
import { DEFAULT_RETURN_PATH, safeReturnPath } from './return-path'

describe('safeReturnPath', () => {
  it('übernimmt Pfade innerhalb der App samt Suche', () => {
    expect(safeReturnPath('/vorrat')).toBe('/vorrat')
    expect(safeReturnPath('/vorrat?filter=bald#oben')).toBe('/vorrat?filter=bald#oben')
  })

  it('nimmt die Übersicht ohne Angabe oder bei anderem Typ', () => {
    expect(safeReturnPath(null)).toBe(DEFAULT_RETURN_PATH)
    expect(safeReturnPath(undefined)).toBe(DEFAULT_RETURN_PATH)
    expect(safeReturnPath(['/vorrat'])).toBe(DEFAULT_RETURN_PATH)
    expect(safeReturnPath('')).toBe(DEFAULT_RETURN_PATH)
  })

  it('lehnt fremde Adressen ab', () => {
    for (const path of ['https://example.org', '//example.org', '/\\example.org', 'vorrat']) {
      expect(safeReturnPath(path)).toBe(DEFAULT_RETURN_PATH)
    }
  })

  it('lehnt Steuerzeichen und überlange Pfade ab', () => {
    expect(safeReturnPath('/vorrat\r\nSet-Cookie: x')).toBe(DEFAULT_RETURN_PATH)
    expect(safeReturnPath(`/${'a'.repeat(2048)}`)).toBe(DEFAULT_RETURN_PATH)
  })

  it('springt nicht zurück auf Anmelden oder Einrichten', () => {
    expect(safeReturnPath('/anmelden')).toBe(DEFAULT_RETURN_PATH)
    expect(safeReturnPath('/anmelden?weiter=/vorrat')).toBe(DEFAULT_RETURN_PATH)
    expect(safeReturnPath('/einrichten/')).toBe(DEFAULT_RETURN_PATH)
    expect(safeReturnPath('/anmeldenx')).toBe('/anmeldenx')
  })
})
