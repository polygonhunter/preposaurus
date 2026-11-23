// Formular → Eingabe des Speicherns (manualCaptureSchema) und Fehler je Feld. Dasselbe Schema
// prüft auf dem Gerät, createStockSchema darin auch auf dem Server.
import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { manualCaptureSchema } from '../schemas/manual-capture'
import {
  captureErrorsOf,
  clearErrorsFor,
  draftForSaving,
  emptyDraft,
  firstInvalidField,
  type ManualCaptureDraft,
} from './manual-capture-draft'

const FOOD_TYPE = '0b1f5c1e-4a3b-4c2d-9e8f-1a2b3c4d5e6f'
const PRODUCT = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f'
const september = {
  date: toCalendarDay('2027-09-30'),
  precision: 'month' as const,
  isEstimated: false,
}

function draft(change: Partial<ManualCaptureDraft> = {}): ManualCaptureDraft {
  return {
    ...emptyDraft(null),
    foodTypeId: FOOD_TYPE,
    content: '500 g',
    units: [
      { bestBefore: september, count: 2 },
      { bestBefore: null, count: 1 },
    ],
    ...change,
  }
}

function errorsOf(input: ManualCaptureDraft) {
  const parsed = manualCaptureSchema.safeParse(input)
  if (parsed.success) throw new Error('sollte scheitern')
  return captureErrorsOf(parsed.error)
}

describe('manualCaptureSchema', () => {
  it('übersetzt ein neues Produkt ohne Nährwerte, „Datum fehlt“ bleibt null', () => {
    const value = manualCaptureSchema.parse(draft())

    expect(value.method).toBe('manual')
    expect(value.product).toMatchObject({
      kind: 'new',
      foodTypeId: FOOD_TYPE,
      content: { value: 500, unit: 'g' },
      nutrition: null,
    })
    expect(value.units).toEqual([
      {
        bestBefore: { date: '2027-09-30', precision: 'month', isEstimated: false },
        kind: 'best-before',
        count: 2,
      },
      { bestBefore: null, kind: 'best-before', count: 1 },
    ])
  })

  it('nimmt eingetippte Nährwerte als eigene Angabe, leere Felder bleiben leer', () => {
    const value = manualCaptureSchema.parse(
      draft({ content: '1,5 kg', nutrition: { kcal: '359', protein: '12,5', carbs: '', fat: '' } }),
    )

    expect(value.product).toMatchObject({
      content: { value: 1500, unit: 'g' },
      nutrition: { kcal: 359, protein: 12.5, carbs: null, fat: null, source: 'manual' },
    })
  })

  it('speichert beim Nachschub nur zum gewählten Produkt', () => {
    const value = manualCaptureSchema.parse(draft({ existingProductId: PRODUCT }))

    expect(value.product).toEqual({ kind: 'existing', productId: PRODUCT })
  })

  it('übergeht beim Nachschub vorher eingetippte Nährwerte, die dann ausgeblendet sind', () => {
    const restock = draft({
      existingProductId: PRODUCT,
      nutrition: { kcal: 'viel', protein: '', carbs: '', fat: '' },
    })

    expect(manualCaptureSchema.safeParse(restock).success).toBe(false)
    expect(manualCaptureSchema.parse(draftForSaving(restock)).product).toEqual({
      kind: 'existing',
      productId: PRODUCT,
    })
    const newProduct = draft()
    expect(draftForSaving(newProduct)).toBe(newProduct)
  })

  it('meldet fehlende Pflichtangaben am jeweiligen Feld', () => {
    const errors = errorsOf({ ...emptyDraft(null) })

    expect(errors).toEqual({
      foodTypeId: 'Bitte wählt eine Lebensmittelart.',
      content: 'Bitte gebt den Inhalt einer Packung an, z. B. 500 g.',
      units: 'Bitte gebt ein MHD ein oder wählt „Datum fehlt“.',
    })
    expect(firstInvalidField(errors)).toBe('foodTypeId')
  })

  it('leitet Stück auf die Anzahl um und prüft Nährwerte und Anzahl je Datum', () => {
    const errors = errorsOf(
      draft({
        content: '6 Stück',
        nutrition: { kcal: 'viel', protein: '', carbs: '-1', fat: '' },
        units: [{ bestBefore: null, count: 100 }],
      }),
    )

    expect(errors.content).toMatch(/Stück zählt als Anzahl der Packungen/)
    expect(errors.kcal).toMatch(/Zahl ab 0/)
    expect(errors.carbs).toMatch(/Zahl ab 0/)
    expect(errors.units).toBe('Höchstens 99 Packungen je Datum.')
    expect(firstInvalidField(errors)).toBe('content')
  })
})

describe('clearErrorsFor', () => {
  it('entfernt nur die Meldungen geänderter Felder, Nährwerte gemeinsam', () => {
    const errors = { content: 'a', units: 'b', kcal: 'c', fat: 'd' }

    expect(clearErrorsFor(errors, ['content'])).toEqual({ units: 'b', kcal: 'c', fat: 'd' })
    expect(clearErrorsFor(errors, ['nutrition'])).toEqual({ content: 'a', units: 'b' })
  })
})
