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
  it('nummeriert wie einrichtung_schritt: Konto 1, Mitglieder 2, Ziel 3, Foto 4, Home 5', () => {
    expect(stepNumber('mitglieder')).toBe(2)
    expect(stepNumber('ziel')).toBe(3)
    expect(stepNumber('foto-erkennung')).toBe(4)
    expect(stepNumber('home-bildschirm')).toBe(5)
  })

  it('zeigt den Home-Bildschirm nur, wenn das Gerät ihn braucht', () => {
    expect(visibleSteps(true)).toEqual(['mitglieder', 'ziel', 'foto-erkennung', 'home-bildschirm'])
    expect(visibleSteps(false)).toEqual(['mitglieder', 'ziel', 'foto-erkennung'])
  })

  it('erkennt nur bekannte Schritte', () => {
    expect(isSetupStep('ziel')).toBe(true)
    expect(isSetupStep('foto-erkennung')).toBe(true)
    expect(isSetupStep('konto')).toBe(false)
    expect(isSetupStep(null)).toBe(false)
  })

  describe('offener Schritt', () => {
    it('nach dem Konto die Mitglieder, danach das Ziel', () => {
      expect(openStep(afterAccount, false)).toBe('mitglieder')
      expect(openStep({ ...afterAccount, lastDoneStep: 2 }, false)).toBe('ziel')
    })

    it('nach dem Ziel auf jedem Gerät die Foto-Erkennung', () => {
      const afterGoal = { ...afterAccount, lastDoneStep: 3 }
      expect(openStep(afterGoal, true)).toBe('foto-erkennung')
      expect(openStep(afterGoal, false)).toBe('foto-erkennung')
    })

    it('nach der Foto-Erkennung nur im iPhone-Safari noch der Home-Bildschirm', () => {
      const afterRecognition = { ...afterAccount, lastDoneStep: 4 }
      expect(openStep(afterRecognition, true)).toBe('home-bildschirm')
      expect(openStep(afterRecognition, false)).toBeNull()
    })

    it('nichts offen nach dem Abschluss, für andere Nutzer und bei Haushalten ohne Einrichtung', () => {
      expect(openStep({ ...afterAccount, completedAt: new Date() }, true)).toBeNull()
      expect(openStep({ ...afterAccount, isSetupAdmin: false }, true)).toBeNull()
      expect(openStep({ ...afterAccount, lastDoneStep: null }, true)).toBeNull()
    })
  })

  it('kennt den nächsten Schritt, null heißt fertig', () => {
    expect(stepAfter('mitglieder', false)).toBe('ziel')
    expect(stepAfter('ziel', false)).toBe('foto-erkennung')
    expect(stepAfter('foto-erkennung', true)).toBe('home-bildschirm')
    expect(stepAfter('foto-erkennung', false)).toBeNull()
    expect(stepAfter('home-bildschirm', true)).toBeNull()
  })

  it('zählt für „Schritt 2 von 5“ das Konto mit und nur sichtbare Schritte', () => {
    expect(stepPosition('mitglieder', true)).toEqual({ number: 2, total: 5 })
    expect(stepPosition('foto-erkennung', false)).toEqual({ number: 4, total: 4 })
    expect(stepPosition('home-bildschirm', true)).toEqual({ number: 5, total: 5 })
  })
})
