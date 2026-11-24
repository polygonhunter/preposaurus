import { afterEach, describe, expect, it, vi } from 'vitest'
import { FALLBACK_RETURN_PATH, readReturnPath, rememberReturnPath } from './return-path'

function stubStorage() {
  const values = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Rücksprung merken', () => {
  it('liest die zuletzt gemerkte Seite', () => {
    stubStorage()
    rememberReturnPath('/nachkaufen')
    rememberReturnPath('/vorrat?suche=reis')

    expect(readReturnPath()).toBe('/vorrat?suche=reis')
  })

  it('ohne gemerkte Seite oder mit fremder Adresse gilt die Übersicht', () => {
    stubStorage()
    expect(readReturnPath()).toBe(FALLBACK_RETURN_PATH)

    for (const foreign of ['//example.org', '/\\example.org', 'https://example.org', '']) {
      rememberReturnPath(foreign)
      expect(readReturnPath()).toBe(FALLBACK_RETURN_PATH)
    }
  })

  it('ist der Speicher gesperrt, gilt die Übersicht', () => {
    const blocked = () => {
      throw new Error('gesperrt')
    }
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked })

    expect(() => {
      rememberReturnPath('/vorrat')
    }).not.toThrow()
    expect(readReturnPath()).toBe(FALLBACK_RETURN_PATH)
  })
})
