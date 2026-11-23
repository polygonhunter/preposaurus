import { describe, expect, it } from 'vitest'
import { findNameConflict } from './catalog-name'

const entries = [
  { id: '1', name: 'Keller', isHidden: false },
  { id: '2', name: 'Garage', isHidden: true },
]

describe('findNameConflict', () => {
  it('findet denselben Namen ohne Groß- und Kleinschreibung und Leerzeichen', () => {
    expect(findNameConflict(entries, ' keller ', null)?.id).toBe('1')
  })

  it('zählt ausgeblendete Einträge mit', () => {
    expect(findNameConflict(entries, 'GARAGE', null)?.isHidden).toBe(true)
  })

  it('übergeht den Eintrag selbst, damit Umbenennen in andere Schreibweise geht', () => {
    expect(findNameConflict(entries, 'KELLER', '1')).toBeNull()
  })

  it('liefert null für einen neuen Namen', () => {
    expect(findNameConflict(entries, 'Vorratsschrank', null)).toBeNull()
  })
})
