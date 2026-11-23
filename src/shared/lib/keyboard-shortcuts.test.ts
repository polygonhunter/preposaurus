import { describe, expect, it } from 'vitest'
import { shortcutFor } from './keyboard-shortcuts'

const plain = {
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  isComposing: false,
  defaultPrevented: false,
}
const body = { tagName: 'BODY', isContentEditable: false }

describe('shortcutFor', () => {
  it('erkennt „/“ als Suche und „n“ als Erfassen', () => {
    expect(shortcutFor({ ...plain, key: '/' }, body)).toBe('search')
    expect(shortcutFor({ ...plain, key: 'n' }, body)).toBe('capture')
  })

  it('nimmt auch „N“ bei Feststelltaste', () => {
    expect(shortcutFor({ ...plain, key: 'N' }, body)).toBe('capture')
  })

  it('greift ohne Ziel, z. B. wenn nichts fokussiert ist', () => {
    expect(shortcutFor({ ...plain, key: '/' }, null)).toBe('search')
  })

  it('schweigt in Eingabefeldern', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(shortcutFor({ ...plain, key: 'n' }, { tagName, isContentEditable: false })).toBeNull()
    }
    expect(shortcutFor({ ...plain, key: '/' }, { tagName: 'DIV', isContentEditable: true })).toBe(
      null,
    )
  })

  it('schweigt mit Strg, Alt oder Befehl', () => {
    expect(shortcutFor({ ...plain, key: 'n', metaKey: true }, body)).toBeNull()
    expect(shortcutFor({ ...plain, key: 'n', ctrlKey: true }, body)).toBeNull()
    expect(shortcutFor({ ...plain, key: '/', altKey: true }, body)).toBeNull()
  })

  it('schweigt bei schon behandelten Tasten und während der Texteingabe per IME', () => {
    expect(shortcutFor({ ...plain, key: 'n', defaultPrevented: true }, body)).toBeNull()
    expect(shortcutFor({ ...plain, key: 'n', isComposing: true }, body)).toBeNull()
  })

  it('ignoriert andere Tasten', () => {
    expect(shortcutFor({ ...plain, key: 'm' }, body)).toBeNull()
    expect(shortcutFor({ ...plain, key: 'Enter' }, body)).toBeNull()
  })
})
