import { describe, expect, it } from 'vitest'
import commonPasswords from './common-passwords.json'
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

  it('lehnt häufige Passwörter ab, auch mit Großbuchstaben, Leer- und Satzzeichen', () => {
    expect(findPasswordProblem('1234567890', context)).toBe('common-password')
    expect(findPasswordProblem('Passwort123!', context)).toBe('common-password')
    expect(findPasswordProblem('Ich liebe dich', context)).toBe('common-password')
    expect(findPasswordProblem('qwertzuiop', context)).toBe('common-password')
    expect(findPasswordProblem('hallo!!!!!', context)).toBe('common-password')
  })

  it('lässt ein häufiges Wort als Teil eines längeren Passworts zu', () => {
    expect(findPasswordProblem('passwort im Vorratsregal links', context)).toBeNull()
  })
})

describe('Liste häufiger Passwörter', () => {
  it('ist kompakt, sortiert, ohne Doppelte und in Vergleichsform gespeichert', () => {
    expect(commonPasswords.length).toBeGreaterThan(1000)
    expect(commonPasswords.length).toBeLessThan(5000)
    expect(new Set(commonPasswords).size).toBe(commonPasswords.length)
    expect([...commonPasswords].sort()).toEqual(commonPasswords)
    for (const entry of commonPasswords) {
      expect(entry).toMatch(/^[\p{Ll}\p{N}]+$/u)
    }
  })
})
