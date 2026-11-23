import { describe, expect, it } from 'vitest'
import {
  isSetupStep,
  openStep,
  stepAfter,
  stepNumber,
  stepPosition,
  visibleSteps,
  type SetupProgress,
} from './setup-steps'

const afterAccount: SetupProgress = { lastDoneStep: 1, completedAt: null, isSetupAdmin: true }

describe('Folgeschritte der Einrichtung', () => {
  it('nummeriert wie einrichtung_schritt: Konto 1, Mitglieder 2, Ziel 3, Home-Bildschirm 4', () => {
    expect(stepNumber('mitglieder')).toBe(2)
    expect(stepNumber('ziel')).toBe(3)
    expect(stepNumber('home-bildschirm')).toBe(4)
  })

  it('zeigt den Home-Bildschirm nur, wenn das Gerät ihn braucht', () => {
    expect(visibleSteps(true)).toEqual(['mitglieder', 'ziel', 'home-bildschirm'])
    expect(visibleSteps(false)).toEqual(['mitglieder', 'ziel'])
  })

  it('erkennt nur bekannte Schritte', () => {
    expect(isSetupStep('ziel')).toBe(true)
    expect(isSetupStep('konto')).toBe(false)
    expect(isSetupStep(null)).toBe(false)
  })

  describe('offener Schritt', () => {
    it('nach dem Konto die Mitglieder, danach das Ziel', () => {
      expect(openStep(afterAccount, false)).toBe('mitglieder')
      expect(openStep({ ...afterAccount, lastDoneStep: 2 }, false)).toBe('ziel')
    })

    it('nach dem Ziel nur im iPhone-Safari noch der Home-Bildschirm', () => {
      const afterGoal = { ...afterAccount, lastDoneStep: 3 }
      expect(openStep(afterGoal, true)).toBe('home-bildschirm')
      expect(openStep(afterGoal, false)).toBeNull()
    })

    it('nichts offen nach dem Abschluss, für andere Nutzer und bei Haushalten ohne Einrichtung', () => {
      expect(openStep({ ...afterAccount, completedAt: new Date() }, true)).toBeNull()
      expect(openStep({ ...afterAccount, isSetupAdmin: false }, true)).toBeNull()
      expect(openStep({ ...afterAccount, lastDoneStep: null }, true)).toBeNull()
    })
  })

  it('kennt den nächsten Schritt, null heißt fertig', () => {
    expect(stepAfter('mitglieder', false)).toBe('ziel')
    expect(stepAfter('ziel', true)).toBe('home-bildschirm')
    expect(stepAfter('ziel', false)).toBeNull()
    expect(stepAfter('home-bildschirm', true)).toBeNull()
  })

  it('zählt für „Schritt 2 von 4“ das Konto mit und nur sichtbare Schritte', () => {
    expect(stepPosition('mitglieder', true)).toEqual({ number: 2, total: 4 })
    expect(stepPosition('ziel', false)).toEqual({ number: 3, total: 3 })
    expect(stepPosition('home-bildschirm', true)).toEqual({ number: 4, total: 4 })
  })
})
