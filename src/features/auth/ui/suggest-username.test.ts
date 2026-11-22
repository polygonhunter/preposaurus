import { describe, expect, it } from 'vitest'
import { suggestUsername } from './suggest-username'

describe('suggestUsername', () => {
  it('nimmt das erste Wort des Anzeigenamens, klein', () => {
    expect(suggestUsername('Alex Beispiel')).toBe('alex')
    expect(suggestUsername('  Kim  ')).toBe('kim')
  })

  it('schreibt Umlaute aus und lässt Akzente weg', () => {
    expect(suggestUsername('Jürgen Groß')).toBe('juergen')
    expect(suggestUsername('Weiß')).toBe('weiss')
    expect(suggestUsername('Zoë')).toBe('zoe')
    expect(suggestUsername('Ömer')).toBe('oemer')
  })

  it('entfernt Zeichen, die im Benutzernamen nicht erlaubt sind', () => {
    expect(suggestUsername('Anne-Marie')).toBe('annemarie')
    expect(suggestUsername('_sam.b')).toBe('sam.b')
  })

  it('kürzt auf 30 Zeichen', () => {
    expect(suggestUsername('a'.repeat(40))).toBe('a'.repeat(30))
  })

  it('schlägt nichts vor, wenn kein gültiger Name herauskommt', () => {
    expect(suggestUsername('')).toBe('')
    expect(suggestUsername('Jo')).toBe('')
    expect(suggestUsername('李雷')).toBe('')
  })
})
