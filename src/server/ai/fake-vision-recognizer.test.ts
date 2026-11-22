import { describe, expect, it } from 'vitest'
import { AI_ROLES } from '@/shared/config/ai-roles'
import { sha256Hex } from '../storage/photo-storage'
import { createFakeVisionRecognizer } from './fake-vision-recognizer'
import type { AiImage, RoleContexts } from './vision-recognizer'

const image = (text: string): AiImage => ({
  data: new TextEncoder().encode(text),
  mimeType: 'image/jpeg',
})

const CONTEXTS: RoleContexts = {
  verpackung: { foodTypes: [{ key: 'spaghetti', name: 'Spaghetti' }] },
  naehrwerte: {},
  naehrwerte_schaetzen: { foodType: { key: 'spaghetti', name: 'Spaghetti' }, productName: null },
  mhd: {},
  mhd_zweitversuch: {},
}

const MHD_READ = {
  roh_text: '30.09.2027',
  datum: '2027-09-30',
  genauigkeit: 'tag',
  art: 'mhd',
  sicherheit: 'hoch',
}

describe('createFakeVisionRecognizer', () => {
  it.each(AI_ROLES)('meldet für %s ohne feste Antwort „nichts erkannt“', async (role) => {
    const outcome = await createFakeVisionRecognizer().recognize({
      role,
      image: image('beliebig'),
      model: 'claude-haiku-5-5',
      context: CONTEXTS[role],
    })

    expect(outcome.answer.ok).toBe(true)
    expect(outcome.answer).toMatchObject({ value: { sicherheit: 'niedrig' } })
    expect(outcome.call).toEqual({
      role,
      model: 'claude-haiku-5-5',
      durationMs: 0,
      inputTokens: 0,
      outputTokens: 0,
    })
  })

  it('liefert die feste Antwort für genau dieses Testbild', async () => {
    const recognizer = createFakeVisionRecognizer([
      { role: 'mhd', imageSha256: sha256Hex(image('dose-1').data), answer: MHD_READ },
    ])
    const request = { role: 'mhd', model: 'm', context: {} } as const

    const match = await recognizer.recognize({ ...request, image: image('dose-1') })
    const other = await recognizer.recognize({ ...request, image: image('dose-2') })

    expect(match.answer).toEqual({ ok: true, value: MHD_READ })
    expect(other.answer).toMatchObject({ ok: true, value: { datum: null } })
  })

  it('gilt ohne Foto-Hash für jedes Bild der Rolle', async () => {
    const recognizer = createFakeVisionRecognizer([{ role: 'mhd', answer: MHD_READ }])

    const outcome = await recognizer.recognize({
      role: 'mhd',
      image: image('irgendein'),
      model: 'm',
      context: {},
    })

    expect(outcome.answer).toEqual({ ok: true, value: MHD_READ })
  })

  it('simuliert Fehlschläge ohne Token-Angaben', async () => {
    const recognizer = createFakeVisionRecognizer([
      { role: 'verpackung', failure: { kind: 'timeout' } },
    ])

    const outcome = await recognizer.recognize({
      role: 'verpackung',
      image: image('x'),
      model: 'm',
      context: CONTEXTS.verpackung,
    })

    expect(outcome.answer).toEqual({ ok: false, error: { kind: 'timeout' } })
    expect(outcome.call).toMatchObject({ inputTokens: null, outputTokens: null })
  })

  it('prüft auch feste Antworten gegen das Schema der Rolle', async () => {
    const recognizer = createFakeVisionRecognizer([
      { role: 'mhd', answer: { ...MHD_READ, sicherheit: 'ganz sicher' } },
    ])

    const outcome = await recognizer.recognize({
      role: 'mhd',
      image: image('x'),
      model: 'm',
      context: {},
    })

    expect(outcome.answer).toMatchObject({ ok: false, error: { kind: 'invalid-response' } })
  })

  it('merkt sich alle Anfragen', async () => {
    const recognizer = createFakeVisionRecognizer()
    const request = { role: 'naehrwerte', image: image('x'), model: 'm', context: {} } as const

    await recognizer.recognize(request)

    expect(recognizer.requests).toEqual([request])
  })
})
