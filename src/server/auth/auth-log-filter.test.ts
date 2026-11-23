import { describe, expect, it } from 'vitest'
import { isIgnoredAuthWarning } from './auth-log-filter'

describe('isIgnoredAuthWarning', () => {
  it('übergeht die Warnung zur fehlenden Base URL', () => {
    expect(
      isIgnoredAuthWarning('[better-auth] Base URL is not set. Set the baseURL option or …'),
    ).toBe(true)
  })

  it('lässt alle anderen Meldungen durch', () => {
    expect(isIgnoredAuthWarning('[better-auth] Misconfiguration detected.')).toBe(false)
  })
})
