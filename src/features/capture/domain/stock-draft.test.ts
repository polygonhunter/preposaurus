import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { planNutrition, planStock, type StockDraft } from './stock-draft'

const now = new Date('2026-11-22T10:00:00Z')

const newProduct = {
  kind: 'new',
  foodTypeId: 'art-nudeln',
  name: null,
  content: { value: 500, unit: 'g' },
  drainedWeightG: null,
  containerId: null,
  storageLocationId: null,
  nutrition: null,
} satisfies StockDraft['product']

function draft(overrides: Partial<StockDraft> = {}): StockDraft {
  return {
    captureId: 'erfassung-1',
    method: 'manual',
    draftId: null,
    product: newProduct,
    units: [{ bestBefore: null, kind: 'best-before', count: 1 }],
    ...overrides,
  }
}

const day = (text: string) => toCalendarDay(text)

describe('planStock', () => {
  it('legt je Packung eine Einheit an, ein Chip mit Anzahl 3 ergibt drei', () => {
    const bestBefore = { date: day('2027-09-30'), precision: 'month', isEstimated: false } as const
    const result = planStock(
      draft({
        units: [
          { bestBefore, kind: 'best-before', count: 3 },
          { bestBefore: null, kind: 'best-before', count: 1 },
        ],
      }),
      now,
    )

    expect(result.ok && result.value.units).toEqual([
      { bestBefore, kind: 'best-before' },
      { bestBefore, kind: 'best-before' },
      { bestBefore, kind: 'best-before' },
      { bestBefore: null, kind: 'best-before' },
    ])
  })

  it('speichert „Datum fehlt“ ohne Datum und ergänzt nichts', () => {
    const result = planStock(draft(), now)

    expect(result.ok && result.value.units).toEqual([{ bestBefore: null, kind: 'best-before' }])
  })

  it('setzt bei Monat bzw. Jahr das Monats- bzw. Jahresende', () => {
    const result = planStock(
      draft({
        units: [
          {
            bestBefore: { date: day('2027-09-01'), precision: 'month', isEstimated: false },
            kind: 'use-by',
            count: 1,
          },
          {
            bestBefore: { date: day('2028-03-15'), precision: 'year', isEstimated: true },
            kind: 'best-before',
            count: 1,
          },
        ],
      }),
      now,
    )

    expect(result.ok && result.value.units.map((unit) => unit.bestBefore?.date)).toEqual([
      '2027-09-30',
      '2028-12-31',
    ])
  })

  it('behält das Kennzeichen „geschätzt“', () => {
    const bestBefore = { date: day('2028-12-31'), precision: 'year', isEstimated: true } as const
    const result = planStock(draft({ units: [{ bestBefore, kind: 'best-before', count: 1 }] }), now)

    expect(result.ok && result.value.units[0]?.bestBefore?.isEstimated).toBe(true)
  })

  it('lehnt eine taggenaue Schätzung ab', () => {
    const bestBefore = { date: day('2028-05-17'), precision: 'day', isEstimated: true } as const
    const result = planStock(draft({ units: [{ bestBefore, kind: 'best-before', count: 1 }] }), now)

    expect(result).toEqual({ ok: false, error: { kind: 'invalid', issue: 'estimate-too-precise' } })
  })

  it('übernimmt eine leere oder nur aus Leerzeichen bestehende Bezeichnung als null', () => {
    const result = planStock(draft({ product: { ...newProduct, name: '  ' } }), now)

    expect(result.ok && result.value.product).toMatchObject({ kind: 'new', name: null })
  })

  it('reicht ein bestehendes Produkt unverändert durch', () => {
    const product = { kind: 'existing', productId: 'produkt-1' } as const
    const result = planStock(draft({ product }), now)

    expect(result.ok && result.value.product).toEqual(product)
  })
})

describe('planNutrition', () => {
  const values = { kcal: 359, protein: 12, carbs: 71, fat: 1.5 }

  it('ohne einen einzigen Wert gibt es keine eigenen Nährwerte', () => {
    const empty = { kcal: null, protein: null, carbs: null, fat: null }
    expect(planNutrition({ ...empty, source: 'manual', isConfirmed: false }, now)).toBeNull()
    expect(planNutrition(null, now)).toBeNull()
  })

  it('setzt die Bestätigung nur bei einer bestätigten KI-Schätzung', () => {
    expect(planNutrition({ ...values, source: 'ai-estimate', isConfirmed: true }, now)).toEqual({
      values,
      source: 'ai-estimate',
      confirmedAt: now,
    })
    expect(
      planNutrition({ ...values, source: 'ai-estimate', isConfirmed: false }, now)?.confirmedAt,
    ).toBeNull()
    expect(planNutrition({ ...values, source: 'label', isConfirmed: true }, now)?.confirmedAt).toBe(
      null,
    )
  })
})
