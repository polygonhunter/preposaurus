import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { Member } from '../domain/member'
import { memberSummary } from './member-labels'

const adult: Member = {
  id: 'm1',
  name: 'Alex',
  type: 'erwachsen',
  birthDate: toCalendarDay('1988-01-01'),
  sex: null,
  activityLevel: null,
  weightKg: null,
  condition: null,
  diet: null,
  allergies: [],
}

describe('memberSummary', () => {
  it('nennt die Ernährungsform des Haushalts, solange die Person keine eigene hat', () => {
    expect(memberSummary(adult, 'vegan')).toBe('Erwachsene:r · 1988 · vegan')
  })

  it('nennt die eigene Ernährungsform und lässt „alles“ weg', () => {
    expect(memberSummary({ ...adult, diet: 'vegetarisch' }, 'alles')).toBe(
      'Erwachsene:r · 1988 · vegetarisch',
    )
    expect(memberSummary({ ...adult, diet: 'alles' }, 'vegan')).toBe('Erwachsene:r · 1988')
  })
})
