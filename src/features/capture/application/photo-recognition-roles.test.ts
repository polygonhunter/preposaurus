import { describe, expect, it } from 'vitest'
import { createFakeVisionRecognizer, type FakeAnswer } from '@/server/ai/fake-vision-recognizer'
import type { AiImage } from '@/server/ai/vision-recognizer'
import { AI_ROLE_DEFAULT_MODELS } from '@/shared/config/ai-roles'
import type { PhotoRole } from '@/shared/config/constants'
import { runRecognitionTask } from './photo-recognition-roles'

const image: AiImage = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }
const FOOD_TYPES = [{ key: 'linsen_getrocknet', name: 'Linsen, getrocknet' }]

function run(role: PhotoRole, answers: FakeAnswer[], withSecondAttempt = true) {
  const recognizer = createFakeVisionRecognizer(answers)
  const { mhd_zweitversuch: second, ...firstAttemptOnly } = AI_ROLE_DEFAULT_MODELS
  const models = withSecondAttempt
    ? { ...firstAttemptOnly, mhd_zweitversuch: second }
    : firstAttemptOnly
  const prepared = { recognizer, models }
  const loadFoodTypes = () => Promise.resolve(FOOD_TYPES)
  return { recognizer, result: runRecognitionTask({ prepared, image, loadFoodTypes }, role) }
}

describe('runRecognitionTask', () => {
  it('übergibt der Verpackung die erlaubten Arten und mappt den Vorschlag', async () => {
    const answer = {
      bezeichnung: ' Linsen ',
      lebensmittelart: 'linsen_getrocknet',
      behaelter: 'packung',
      inhalt: { wert: 500, einheit: 'g' },
      abtropfgewicht_g: null,
      sicherheit: 'hoch',
    }
    const { recognizer, result } = run('verpackung', [{ role: 'verpackung', answer }])

    expect(await result).toMatchObject({
      ok: true,
      value: {
        role: 'verpackung',
        packaging: { name: 'Linsen', foodTypeKey: 'linsen_getrocknet', drainedWeightG: null },
      },
    })
    expect(recognizer.requests[0]?.context).toEqual({ foodTypes: FOOD_TYPES })
  })

  it('liest eine Nährwerttabelle als „label“, nie als Schätzung', async () => {
    const { recognizer, result } = run('naehrwerte', [])

    expect(await result).toMatchObject({
      ok: true,
      value: { role: 'naehrwerte', nutrition: { source: 'label' } },
    })
    expect(recognizer.requests.map((request) => request.role)).toEqual(['naehrwerte'])
  })

  it('macht beim unlesbaren MHD den Zweitversuch und erfindet kein Datum', async () => {
    const { recognizer, result } = run('mhd', [])

    expect(await result).toMatchObject({
      ok: true,
      value: { role: 'mhd', bestBefore: { bestBefore: null }, conflictingDate: null },
    })
    expect(recognizer.requests.map((request) => request.role)).toEqual(['mhd', 'mhd_zweitversuch'])
  })

  it('bleibt ohne aktive Zweitversuch-Rolle beim ersten Versuch', async () => {
    const { recognizer, result } = run('mhd', [], false)

    await result
    expect(recognizer.requests).toHaveLength(1)
  })

  it.each<PhotoRole>(['verpackung', 'naehrwerte', 'mhd'])(
    'gibt den Fehler des Adapters weiter (%s)',
    async (role) => {
      const answers: FakeAnswer[] = [
        { role, failure: { kind: 'timeout' } },
        { role: 'mhd_zweitversuch', failure: { kind: 'timeout' } },
      ]

      expect(await run(role, answers).result).toEqual({ ok: false, error: { kind: 'timeout' } })
    },
  )

  it('wirft, wenn für eine Pflichtrolle kein Modell vorbereitet ist', async () => {
    const recognizer = createFakeVisionRecognizer()
    const prepared = { recognizer, models: {} }
    const loadFoodTypes = () => Promise.resolve([])

    await expect(
      runRecognitionTask({ prepared, image, loadFoodTypes }, 'naehrwerte'),
    ).rejects.toThrow('Kein Modell')
  })
})
