import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { birthFromDate, findBirthProblem, toBirthDate } from './birth'
import { effectiveDiet } from './member'

const today = toCalendarDay('2026-11-23')

describe('Geburtsangabe', () => {
  it('verlangt bei Babys den Monat, sonst nicht', () => {
    expect(findBirthProblem({ year: 2026, month: null }, 'baby', today)).toBe('month-missing')
    expect(findBirthProblem({ year: 2026, month: 3 }, 'baby', today)).toBeNull()
    expect(findBirthProblem({ year: 1988, month: null }, 'erwachsen', today)).toBeNull()
  })

  it('lehnt ein Jahr oder einen Monat in der Zukunft ab', () => {
    expect(findBirthProblem({ year: 2027, month: null }, 'kind', today)).toBe('in-future')
    expect(findBirthProblem({ year: 2026, month: 12 }, 'baby', today)).toBe('in-future')
    expect(findBirthProblem({ year: 2026, month: 11 }, 'baby', today)).toBeNull()
  })

  it('speichert bei Babys den Ersten des Monats, sonst den 1. Januar', () => {
    expect(toBirthDate({ year: 2026, month: 3 }, 'baby')).toBe('2026-03-01')
    expect(toBirthDate({ year: 1988, month: 5 }, 'erwachsen')).toBe('1988-01-01')
    expect(toBirthDate({ year: 2026, month: null }, 'baby')).toBe('2026-01-01')
  })

  it('wirft bei einem Jahr, das kein Kalendertag sein kann', () => {
    expect(() => toBirthDate({ year: 12, month: null }, 'senior')).toThrow(RangeError)
  })

  it('liest den Monat nur bei Babys zurück', () => {
    const date = toCalendarDay('2025-07-01')

    expect(birthFromDate(date, 'baby')).toEqual({ year: 2025, month: 7 })
    expect(birthFromDate(date, 'kind')).toEqual({ year: 2025, month: null })
  })
})

describe('Ernährungsform einer Person', () => {
  it('folgt dem Haushalt, solange die Person keine eigene hat', () => {
    expect(effectiveDiet({ diet: null }, 'vegetarisch')).toBe('vegetarisch')
    expect(effectiveDiet({ diet: 'vegan' }, 'alles')).toBe('vegan')
  })
})
