import { describe, expect, it } from 'vitest'
import { isActivePath, mostSpecificActivePath } from './paths'

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

describe('mostSpecificActivePath', () => {
  const hrefs = ['/uebersicht', '/uebersicht/bald-faellig', '/vorrat']

  it('wählt das genaueste von ineinanderliegenden Zielen', () => {
    expect(mostSpecificActivePath('/uebersicht/bald-faellig', hrefs)).toBe(
      '/uebersicht/bald-faellig',
    )
  })

  it('bleibt beim übergeordneten Ziel, solange kein genaueres passt', () => {
    expect(mostSpecificActivePath('/uebersicht', hrefs)).toBe('/uebersicht')
    expect(mostSpecificActivePath('/vorrat/art/1', hrefs)).toBe('/vorrat')
  })

  it('liefert null außerhalb aller Ziele', () => {
    expect(mostSpecificActivePath('/einstellungen', hrefs)).toBeNull()
  })
})
