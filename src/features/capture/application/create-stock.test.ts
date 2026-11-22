import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { createFakeStockWriter } from '../../../../tests/helpers/fake-stock-writer'
import type { StockDraft } from '../domain/stock-draft'
import { createStock } from './create-stock'

const householdId = 'haushalt-a'
const otherHousehold = 'haushalt-b'
const userId = 'nutzer-a'
const noodles = { id: 'art-nudeln', name: 'Nudeln', categoryId: 'kategorie-getreide' }
const now = new Date('2026-11-22T10:00:00Z')

function setup() {
  const writer = createFakeStockWriter({
    foodTypes: { [householdId]: [noodles], [otherHousehold]: [noodles] },
    storageLocations: { [householdId]: ['lager-keller'] },
    containers: ['behaelter-packung'],
  })
  const save = (draft: StockDraft, household = householdId) =>
    createStock({ writer, now: () => now }, { householdId: household, userId, draft })
  return { writer, save }
}

const september = { date: toCalendarDay('2027-09-30'), precision: 'month', isEstimated: false }

function draft(overrides: Partial<StockDraft> = {}): StockDraft {
  return {
    captureId: 'erfassung-1',
    method: 'photo',
    product: {
      kind: 'new',
      foodTypeId: noodles.id,
      name: null,
      content: { value: 500, unit: 'g' },
      drainedWeightG: null,
      containerId: 'behaelter-packung',
      storageLocationId: 'lager-keller',
      nutrition: null,
    },
    units: [
      { bestBefore: september, kind: 'best-before', count: 4 },
      { bestBefore: null, kind: 'best-before', count: 2 },
    ],
    ...overrides,
  } as StockDraft
}

describe('createStock', () => {
  it('legt Erfassung, Produkt und je Packung eine Einheit an', async () => {
    const { writer, save } = setup()

    const result = await save(draft())

    expect(result).toMatchObject({ ok: true, value: { unitCount: 6, isReplay: false } })
    expect(writer.state.captures).toEqual([
      { id: 'erfassung-1', householdId, userId, method: 'photo' },
    ])
    expect(writer.state.products).toHaveLength(1)
    expect(writer.state.units.filter((unit) => unit.bestBefore === null)).toHaveLength(2)
  })

  it('leitet die Kategorie aus der Lebensmittelart ab und nimmt deren Namen ohne Bezeichnung', async () => {
    const { writer, save } = setup()

    await save(draft())

    expect(writer.state.products[0]).toMatchObject({
      householdId,
      categoryId: noodles.categoryId,
      foodTypeId: noodles.id,
      name: 'Nudeln',
    })
  })

  it('legt mit demselben Idempotenz-Schlüssel nichts doppelt an', async () => {
    const { writer, save } = setup()
    const first = await save(draft())

    const second = await save(draft())

    expect(writer.state.products).toHaveLength(1)
    expect(writer.state.units).toHaveLength(6)
    expect(second).toEqual({
      ok: true,
      value: { ...(first.ok ? first.value : {}), isReplay: true },
    })
  })

  it('meldet einen Konflikt, wenn der Schlüssel einem anderen Haushalt gehört', async () => {
    const { writer, save } = setup()
    await save(draft())

    const result = await save(draft(), otherHousehold)

    expect(result).toEqual({ ok: false, error: { kind: 'conflict' } })
    expect(writer.state.units).toHaveLength(6)
  })

  it('fügt Nachschub zu einem bestehenden Produkt mit eigener Erfassung hinzu', async () => {
    const { writer, save } = setup()
    const first = await save(draft())
    const productId = first.ok ? first.value.productId : ''

    const result = await save(
      draft({
        captureId: 'erfassung-2',
        method: 'manual',
        product: { kind: 'existing', productId },
        units: [{ bestBefore: null, kind: 'best-before', count: 3 }],
      }),
    )

    expect(result).toMatchObject({ ok: true, value: { productId, unitCount: 3 } })
    expect(writer.state.products).toHaveLength(1)
    expect(writer.state.units.filter((unit) => unit.captureId === 'erfassung-2')).toHaveLength(3)
  })

  it('kennt kein fremdes Produkt', async () => {
    const { writer, save } = setup()
    const base = draft({ captureId: 'erfassung-fremd' })
    const product = { ...base.product, storageLocationId: null } as StockDraft['product']
    const foreign = await save({ ...base, product }, otherHousehold)
    const productId = foreign.ok ? foreign.value.productId : ''
    expect(foreign.ok).toBe(true)

    const result = await save(draft({ product: { kind: 'existing', productId } }))

    expect(result).toEqual({ ok: false, error: { kind: 'not-found', reference: 'product' } })
    expect(writer.state.captures).toHaveLength(1)
  })

  it.each([
    ['food-type', { foodTypeId: 'art-unbekannt' }],
    ['container', { containerId: 'behaelter-unbekannt' }],
    ['storage-location', { storageLocationId: 'lager-fremd' }],
  ])(
    'lehnt unbekannte oder fremde Stammdaten ab (%s) und speichert nichts',
    async (ref, change) => {
      const { writer, save } = setup()
      const base = draft()
      const product = { ...base.product, ...change } as StockDraft['product']

      const result = await save({ ...base, product })

      expect(result).toEqual({ ok: false, error: { kind: 'not-found', reference: ref } })
      expect(writer.state).toEqual({ captures: [], products: [], units: [] })
    },
  )

  it('lehnt eine taggenaue Schätzung ab, bevor etwas gespeichert wird', async () => {
    const { writer, save } = setup()
    const guessed = { date: toCalendarDay('2028-05-17'), precision: 'day', isEstimated: true }

    const result = await save(
      draft({ units: [{ bestBefore: guessed, kind: 'best-before', count: 1 }] } as never),
    )

    expect(result).toEqual({ ok: false, error: { kind: 'invalid', issue: 'estimate-too-precise' } })
    expect(writer.state.captures).toEqual([])
  })

  it('lässt nach einem Abbruch mitten in der Transaktion nichts zurück', async () => {
    const { writer, save } = setup()
    writer.failNextUnitInsert()

    await expect(save(draft())).rejects.toThrow()

    expect(writer.state).toEqual({ captures: [], products: [], units: [] })
  })

  it('setzt die Bestätigung einer KI-Schätzung der Nährwerte auf jetzt', async () => {
    const { writer, save } = setup()
    const base = draft()
    const nutrition = {
      kcal: 350,
      protein: 12,
      carbs: 70,
      fat: 2,
      source: 'ai-estimate',
      isConfirmed: true,
    } as const

    await save({ ...base, product: { ...base.product, nutrition } as StockDraft['product'] })

    expect(writer.state.products[0]?.nutrition).toEqual({
      values: { kcal: 350, protein: 12, carbs: 70, fat: 2 },
      source: 'ai-estimate',
      confirmedAt: now,
    })
  })
})
