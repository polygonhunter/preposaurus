import { describe, expect, it } from 'vitest'
import { isActivePath } from './paths'

describe('isActivePath', () => {
  it('erkennt das Ziel selbst', () => {
    expect(isActivePath('/vorrat', '/vorrat')).toBe(true)
  })

  it('erkennt Unterseiten des Ziels', () => {
    expect(isActivePath('/vorrat/reis', '/vorrat')).toBe(true)
  })

  it('verwechselt keine Ziele mit gleichem Anfang', () => {
    expect(isActivePath('/vorratsliste', '/vorrat')).toBe(false)
    expect(isActivePath('/uebersicht', '/vorrat')).toBe(false)
  })
})
