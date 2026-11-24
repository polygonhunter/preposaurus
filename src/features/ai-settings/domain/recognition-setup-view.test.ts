import { describe, expect, it } from 'vitest'
import { recognitionSetupView } from './recognition-setup-view'

describe('Schritt „Foto-Erkennung einrichten“', () => {
  it('nennt eine Verbindung aus der Umgebung nur, ohne Formular', () => {
    expect(recognitionSetupView({ envConnection: 'anthropic', status: 'disabled' })).toEqual({
      kind: 'env',
      provider: 'anthropic',
    })
    expect(recognitionSetupView({ envConnection: 'fake', status: 'ready' })).toEqual({
      kind: 'env',
      provider: 'fake',
    })
  })

  it('zeigt das Formular, solange die Erkennung nicht bereit ist', () => {
    for (const status of ['not-configured', 'disabled', 'test-failed'] as const) {
      expect(recognitionSetupView({ envConnection: null, status })).toEqual({ kind: 'form' })
    }
  })

  it('braucht kein Formular mehr, wenn die Erkennung eingerichtet und an ist', () => {
    expect(recognitionSetupView({ envConnection: null, status: 'ready' })).toEqual({
      kind: 'ready',
    })
  })
})
