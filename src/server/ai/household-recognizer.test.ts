import { describe, expect, it } from 'vitest'
import { SecretValue } from '../crypto/secret-value'
import { createVisionRecognizer } from './create-vision-recognizer'
import { createFakeVisionRecognizer } from './fake-vision-recognizer'
import { createHouseholdRecognizer, type AiCallEntry } from './household-recognizer'
import type { AiImage } from './vision-recognizer'

const IMAGE: AiImage = { data: new Uint8Array([1]), mimeType: 'image/jpeg' }
const READ_DATE = {
  roh_text: '08/2027',
  datum: '2027-08-31',
  genauigkeit: 'monat',
  art: 'mhd',
  sicherheit: 'mittel',
}

function setup() {
  const entries: AiCallEntry[] = []
  const first = createFakeVisionRecognizer([{ role: 'mhd', answer: READ_DATE }])
  const second = createFakeVisionRecognizer([
    { role: 'mhd_zweitversuch', failure: { kind: 'timeout' } },
  ])
  const recognizer = createHouseholdRecognizer({
    householdId: 'h1',
    photoId: 'f1',
    routes: {
      mhd: { recognizer: first, connectionId: 'v1' },
      mhd_zweitversuch: { recognizer: second, connectionId: null },
    },
    log: {
      record: (entry) => {
        entries.push(entry)
        return Promise.resolve()
      },
    },
  })
  return { recognizer, entries, first, second }
}

describe('createHouseholdRecognizer', () => {
  it('leitet jede Rolle an den Adapter ihrer Verbindung weiter', async () => {
    const { recognizer, first, second } = setup()

    await recognizer.recognize({ role: 'mhd', image: IMAGE, model: 'haiku', context: {} })

    expect(first.requests).toHaveLength(1)
    expect(second.requests).toHaveLength(0)
  })

  it('protokolliert einen Erfolg mit Versuch 1, Verbindung, Sicherheit und Kosten', async () => {
    const { recognizer, entries } = setup()

    await recognizer.recognize({
      role: 'mhd',
      image: IMAGE,
      model: 'claude-haiku-5-5',
      context: {},
    })

    expect(entries).toEqual([
      expect.objectContaining({
        householdId: 'h1',
        photoId: 'f1',
        connectionId: 'v1',
        role: 'mhd',
        attempt: 1,
        model: 'claude-haiku-5-5',
        confidence: 'mittel',
        isSuccess: true,
        errorKind: null,
        costUsd: 0,
      }),
    ])
  })

  it('protokolliert einen Fehlschlag im Zweitversuch mit Versuch 2 und Fehlerart', async () => {
    const { recognizer, entries } = setup()
    const request = {
      role: 'mhd_zweitversuch',
      image: IMAGE,
      model: 'sonnet',
      context: {},
    } as const

    await recognizer.recognize(request)

    expect(entries[0]).toMatchObject({
      attempt: 2,
      connectionId: null,
      confidence: null,
      isSuccess: false,
      errorKind: 'timeout',
      costUsd: null,
    })
  })

  it('wirft bei einer Rolle, die der Konfigurations-Service nicht freigegeben hat', async () => {
    const { recognizer } = setup()
    const request = { role: 'naehrwerte', image: IMAGE, model: 'm', context: {} } as const

    await expect(recognizer.recognize(request)).rejects.toThrow('nicht eingerichtet')
  })
})

describe('createVisionRecognizer', () => {
  it('liefert mit AI_PROVIDER=fake den Fake, der Verbindungstest gelingt immer', async () => {
    const connection = {
      provider: 'anthropic',
      apiKey: new SecretValue('egal'),
      baseUrl: null,
    } as const
    const recognizer = createVisionRecognizer({ AI_PROVIDER: 'fake' }, connection)

    expect(await recognizer.testConnection('m')).toEqual({ ok: true, value: null })
    const outcome = await recognizer.recognize({
      role: 'mhd',
      image: IMAGE,
      model: 'm',
      context: {},
    })
    expect(outcome.answer).toMatchObject({ ok: true, value: { datum: null } })
  })

  it('baut mit AI_PROVIDER=anthropic den echten Adapter, ohne schon etwas zu senden', () => {
    const connection = {
      provider: 'anthropic',
      apiKey: new SecretValue('sk-ant-test'),
      baseUrl: null,
    } as const
    const recognizer = createVisionRecognizer({ AI_PROVIDER: 'anthropic' }, connection)

    expect(typeof recognizer.recognize).toBe('function')
    expect(typeof recognizer.testConnection).toBe('function')
  })
})
