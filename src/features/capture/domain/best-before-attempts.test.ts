import { describe, expect, it } from 'vitest'
import type { AiBestBeforeAnswer } from './ai-answers'
import { mergeAttempts, needsSecondAttempt } from './best-before-attempts'

const answer = (overrides: Partial<AiBestBeforeAnswer>): AiBestBeforeAnswer => ({
  roh_text: '30.09.2027',
  datum: '2027-09-30',
  genauigkeit: 'tag',
  art: 'mhd',
  sicherheit: 'hoch',
  ...overrides,
})

describe('needsSecondAttempt', () => {
  it('braucht keinen Zweitversuch bei sicherem Datum', () => {
    expect(needsSecondAttempt(answer({}))).toBe(false)
    expect(needsSecondAttempt(answer({ sicherheit: 'mittel' }))).toBe(false)
  })

  it('versucht es erneut bei niedriger Sicherheit', () => {
    expect(needsSecondAttempt(answer({ sicherheit: 'niedrig' }))).toBe(true)
  })

  it('versucht es erneut ohne Datum oder mit ungültigem Datum', () => {
    expect(needsSecondAttempt(answer({ datum: null }))).toBe(true)
    expect(needsSecondAttempt(answer({ datum: '2027-02-30' }))).toBe(true)
  })
})

describe('mergeAttempts', () => {
  const sure = answer({ datum: '2027-08-31', roh_text: '31.08.2027' })
  const unsure = answer({ datum: '2027-09-30', sicherheit: 'niedrig' })
  const empty = answer({ datum: null, roh_text: null, sicherheit: 'niedrig' })

  it('nimmt Versuch 2, wenn nur er ein Datum hat', () => {
    expect(mergeAttempts(empty, sure)).toEqual({ answer: sure, conflictingDate: null })
  })

  it('nimmt Versuch 2 unverändert, wenn beide dasselbe Datum lesen', () => {
    const same = answer({ datum: ' 2027-09-30 ', sicherheit: 'hoch' })

    expect(mergeAttempts(unsure, same)).toEqual({ answer: same, conflictingDate: null })
  })

  it('macht bei zwei verschiedenen Daten Versuch 2 zu „bitte prüfen“ und behält Versuch 1', () => {
    expect(mergeAttempts(unsure, sure)).toEqual({
      answer: { ...sure, sicherheit: 'niedrig' },
      conflictingDate: '2027-09-30',
    })
  })

  it('nimmt Versuch 1 als „bitte prüfen“, wenn nur er ein Datum hat', () => {
    const firstMedium = answer({ sicherheit: 'mittel' })

    expect(mergeAttempts(firstMedium, empty)).toEqual({
      answer: { ...firstMedium, sicherheit: 'niedrig' },
      conflictingDate: null,
    })
    expect(mergeAttempts(firstMedium, null)?.answer.sicherheit).toBe('niedrig')
  })

  it('liefert ohne Datum in beiden Versuchen die Antwort von Versuch 2', () => {
    const secondEmpty = answer({ datum: null, roh_text: 'L1234 08:15', sicherheit: 'mittel' })

    expect(mergeAttempts(empty, secondEmpty)).toEqual({
      answer: secondEmpty,
      conflictingDate: null,
    })
  })

  it('wertet ein ungültiges Datum wie kein Datum, ein Widerspruch entsteht daraus nicht', () => {
    const invalid = answer({ datum: '2027-02-30', sicherheit: 'niedrig' })

    expect(mergeAttempts(invalid, sure)).toEqual({ answer: sure, conflictingDate: null })
  })

  it('nimmt den Versuch, der nicht gescheitert ist', () => {
    expect(mergeAttempts(null, sure)).toEqual({ answer: sure, conflictingDate: null })
    expect(mergeAttempts(empty, null)).toEqual({ answer: empty, conflictingDate: null })
  })

  it('ergibt null, wenn beide Versuche gescheitert sind', () => {
    expect(mergeAttempts(null, null)).toBeNull()
  })
})
