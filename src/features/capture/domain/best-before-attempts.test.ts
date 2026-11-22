import { describe, expect, it } from 'vitest'
import type { AiBestBeforeAnswer } from './ai-answers'
import { needsSecondAttempt, pickBestBeforeAnswer } from './best-before-attempts'

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

describe('pickBestBeforeAnswer', () => {
  const sure = answer({})
  const unsure = answer({ datum: '2027-10-31', sicherheit: 'niedrig' })
  const empty = answer({ datum: null, roh_text: null, sicherheit: 'niedrig' })

  it('bleibt beim ersten Versuch, wenn der Zweitversuch gescheitert ist', () => {
    expect(pickBestBeforeAnswer(unsure, null)).toBe(unsure)
  })

  it('nimmt das Datum vor „kein Datum“, egal aus welchem Versuch', () => {
    expect(pickBestBeforeAnswer(empty, unsure)).toBe(unsure)
    expect(pickBestBeforeAnswer(unsure, empty)).toBe(unsure)
  })

  it('nimmt bei zwei Daten das sicherere', () => {
    expect(pickBestBeforeAnswer(unsure, sure)).toBe(sure)
    expect(pickBestBeforeAnswer(answer({ sicherheit: 'mittel' }), unsure).sicherheit).toBe('mittel')
  })

  it('nimmt bei Gleichstand den Zweitversuch', () => {
    const second = answer({ datum: '2027-11-30', sicherheit: 'niedrig' })

    expect(pickBestBeforeAnswer(unsure, second)).toBe(second)
    expect(pickBestBeforeAnswer(empty, { ...empty })).not.toBe(empty)
  })
})
