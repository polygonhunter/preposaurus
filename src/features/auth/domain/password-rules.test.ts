import { describe, expect, it } from 'vitest'
import { findPasswordProblem } from './password-rules'

const context = {
  username: 'sam.beispiel',
  displayName: 'Sam B.',
  householdName: 'Unser Haushalt',
}

describe('findPasswordProblem', () => {
  it('lässt ein Passwort ohne bekannte Namen durch', () => {
    expect(findPasswordProblem('Hafer Linse Regal Wolke', context)).toBeNull()
  })

  it('lehnt den Namen der App ab, auch mit Anhängsel und in Großbuchstaben', () => {
    expect(findPasswordProblem('PREPOSAURUS-2026', context)).toBe('contains-app-name')
  })

  it('lehnt den Benutzernamen als Bestandteil ab, ohne Rücksicht auf Satzzeichen', () => {
    expect(findPasswordProblem('mein-sambeispiel-passwort', context)).toBe('contains-username')
  })

  it('lehnt den Anzeigenamen ab, ohne Rücksicht auf Leer- und Satzzeichen', () => {
    expect(findPasswordProblem('ich bin SAMB und mag Hafer', context)).toBe('contains-display-name')
  })

  it('lehnt den Haushaltsnamen ab, auch mit anderen Leerzeichen', () => {
    expect(findPasswordProblem('unserhaushalt 2026!', context)).toBe('contains-household-name')
  })

  it('übergeht sehr kurze Namen und einen fehlenden Haushaltsnamen', () => {
    expect(findPasswordProblem('ab-ist-ein-passwort', { username: 'ab' })).toBeNull()
    expect(findPasswordProblem('Hafer Linse Regal Wolke', { username: 'kim' })).toBeNull()
  })
})
