import { describe, expect, it } from 'vitest'
import { suggestConnectionName } from './connection-name'

describe('Name der nächsten Verbindung', () => {
  it('heißt „Anthropic“, solange es den Namen nicht gibt', () => {
    expect(suggestConnectionName([])).toBe('Anthropic')
    expect(suggestConnectionName(['Büro'])).toBe('Anthropic')
  })

  it('zählt weiter, ohne auf Groß- und Kleinschreibung zu achten', () => {
    expect(suggestConnectionName(['anthropic'])).toBe('Anthropic 2')
    expect(suggestConnectionName(['Anthropic', 'ANTHROPIC 2'])).toBe('Anthropic 3')
  })
})
