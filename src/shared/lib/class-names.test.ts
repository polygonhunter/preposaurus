import { describe, expect, it } from 'vitest'
import { cx } from './class-names'

describe('cx', () => {
  it('verbindet Klassen mit Leerzeichen und lässt leere Bedingungen weg', () => {
    expect(cx('a', false, 'b', null, undefined, '', 'c')).toBe('a b c')
  })
})
