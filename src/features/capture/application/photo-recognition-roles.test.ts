import { describe, expect, it } from 'vitest'
import { createFakeVisionRecognizer, type FakeAnswer } from '@/server/ai/fake-vision-recognizer'
import type { AiImage } from '@/server/ai/vision-recognizer'
import { AI_ROLE_DEFAULT_MODELS } from '@/shared/config/ai-roles'
import { runRecognitionTask, type RecognitionTask } from './photo-recognition-roles'

const image: AiImage = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }
const FOOD_TYPES = [{ key: 'linsen_getrocknet', name: 'Linsen, getrocknet' }]

function run(task: RecognitionTask, answers: FakeAnswer[], withSecondAttempt = true) {
  const recognizer = createFakeVisionRecognizer(answers)
  const { mhd_zweitversuch: second, ...firstAttemptOnly } = AI_ROLE_DEFAULT_MODELS
  const models = withSecondAttempt
    ? { ...firstAttemptOnly, mhd_zweitversuch: second }
    : firstAttemptOnly
  const prepared = { recognizer, models }
  const loadFoodTypes = () => Promise.resolve(FOOD_TYPES)
  return { recognizer, result: runRecognitionTask({ prepared, image, loadFoodTypes }, task) }
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
    const { recognizer, result } = run({ role: 'verpackung' }, [{ role: 'verpackung', answer }])

    expect(await result).toMatchObject({
      ok: true,
      value: {
        role: 'verpackung',
        packaging: { name: 'Linsen', foodTypeKey: 'linsen_getrocknet', drainedWeightG: null },
      },
    })
    expect(recognizer.requests[0]?.context).toEqual({ foodTypes: FOOD_TYPES })
  })

  it('liest eine Nährwerttabelle als „label“', async () => {
    const { result } = run({ role: 'naehrwerte' }, [])

    expect(await result).toMatchObject({
      ok: true,
      value: { role: 'naehrwerte', nutrition: { source: 'label' } },
    })
  })

  it('schätzt nur mit Art aus der erlaubten Liste, sonst ohne Art', async () => {
    const known = run(
      {
        role: 'naehrwerte_schaetzen',
        hint: { foodTypeKey: 'linsen_getrocknet', productName: 'Linsen' },
      },
      [],
    )
    const unknown = run(
      { role: 'naehrwerte_schaetzen', hint: { foodTypeKey: 'erfunden', productName: null } },
      [],
    )

    expect(await known.result).toMatchObject({ value: { nutrition: { source: 'ai-estimate' } } })
    expect(known.recognizer.requests[0]?.context).toEqual({
      foodType: FOOD_TYPES[0],
      productName: 'Linsen',
    })
    await unknown.result
    expect(unknown.recognizer.requests[0]?.context).toEqual({ foodType: null, productName: null })
  })

  it('macht beim unlesbaren MHD den Zweitversuch und erfindet kein Datum', async () => {
    const { recognizer, result } = run({ role: 'mhd' }, [])

    expect(await result).toMatchObject({
      ok: true,
      value: { role: 'mhd', bestBefore: { bestBefore: null }, conflictingDate: null },
    })
    expect(recognizer.requests.map((request) => request.role)).toEqual(['mhd', 'mhd_zweitversuch'])
  })

  it('bleibt ohne aktive Zweitversuch-Rolle beim ersten Versuch', async () => {
    const { recognizer, result } = run({ role: 'mhd' }, [], false)

    await result
    expect(recognizer.requests).toHaveLength(1)
  })

  it.each<RecognitionTask>([
    { role: 'verpackung' },
    { role: 'naehrwerte' },
    { role: 'naehrwerte_schaetzen', hint: { foodTypeKey: null, productName: null } },
    { role: 'mhd' },
  ])('gibt den Fehler des Adapters weiter (%o)', async (task) => {
    const answers: FakeAnswer[] = [
      { role: task.role, failure: { kind: 'timeout' } },
      { role: 'mhd_zweitversuch', failure: { kind: 'timeout' } },
    ]

    expect(await run(task, answers).result).toEqual({ ok: false, error: { kind: 'timeout' } })
  })

  it('wirft, wenn für eine Pflichtrolle kein Modell vorbereitet ist', async () => {
    const recognizer = createFakeVisionRecognizer()
    const prepared = { recognizer, models: {} }
    const loadFoodTypes = () => Promise.resolve([])

    await expect(
      runRecognitionTask({ prepared, image, loadFoodTypes }, { role: 'naehrwerte' }),
    ).rejects.toThrow('Kein Modell')
  })
})
