import { describe, expect, it, vi } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { createFakeStockWriter } from '../../../../tests/helpers/fake-stock-writer'
import type { StockDraft } from '../domain/stock-draft'
import type { SupplyDaysFigures } from '../domain/supply-change'
import { createStockWithSupply } from './create-stock-with-supply'

const householdId = 'haushalt-a'
const userId = 'nutzer-a'
const noodles = { id: 'art-nudeln', name: 'Nudeln', categoryId: 'kategorie-getreide' }
const now = new Date('2026-11-22T10:00:00Z')

const draft = {
  captureId: 'erfassung-1',
  method: 'manual',
  draftId: null,
  product: {
    kind: 'new',
    foodTypeId: noodles.id,
    name: null,
    content: { value: 500, unit: 'g' },
    drainedWeightG: null,
    containerId: null,
    storageLocationId: null,
    nutrition: null,
  },
  units: [
    {
      bestBefore: { date: toCalendarDay('2027-09-30'), precision: 'month', isEstimated: false },
      kind: 'best-before',
      count: 6,
    },
  ],
} as StockDraft

/** Liefert nacheinander die Tage vor und nach dem Speichern. */
function setup(...figures: (SupplyDaysFigures | null)[]) {
  const writer = createFakeStockWriter({ foodTypes: { [householdId]: [noodles] } })
  const readSupplyDays = vi.fn<(id: string) => Promise<SupplyDaysFigures | null>>()
  for (const entry of figures) readSupplyDays.mockResolvedValueOnce(entry)
  const logWarning = vi.fn()
  const save = () =>
    createStockWithSupply(
      { writer, now: () => now, readSupplyDays, logWarning },
      { householdId, userId, draft },
    )
  return { save, readSupplyDays, writer, logWarning }
}

describe('createStockWithSupply', () => {
  it('liefert die Tage vor und nach dem Speichern, wenn sich die ganze Zahl ändert', async () => {
    const { save, readSupplyDays } = setup(
      { energyDays: 9.4, waterDays: 3 },
      { energyDays: 11.3, waterDays: 3 },
    )

    const result = await save()

    expect(result).toMatchObject({
      ok: true,
      value: { unitCount: 6, supplyChange: { resource: 'energy', before: 9.4, after: 11.3 } },
    })
    expect(readSupplyDays).toHaveBeenCalledWith(householdId)
    expect(readSupplyDays).toHaveBeenCalledTimes(2)
  })

  it('bleibt ohne Satz, wenn sich nur die Nachkommastelle ändert', async () => {
    const { save } = setup({ energyDays: 9.1, waterDays: 3 }, { energyDays: 9.8, waterDays: 3 })

    expect(await save()).toMatchObject({ ok: true, value: { supplyChange: null } })
  })

  it('rechnet ohne Bedarf nicht nach', async () => {
    const { save, readSupplyDays } = setup(null)

    expect(await save()).toMatchObject({ ok: true, value: { supplyChange: null } })
    expect(readSupplyDays).toHaveBeenCalledTimes(1)
  })

  it('gibt beim doppelten Tippen keinen Satz, weil nichts dazukam', async () => {
    const { save, readSupplyDays } = setup(
      { energyDays: 1, waterDays: 1 },
      { energyDays: 3, waterDays: 1 },
      { energyDays: 3, waterDays: 1 },
    )
    await save()

    const replay = await save()

    expect(replay).toMatchObject({ ok: true, value: { isReplay: true, supplyChange: null } })
    expect(readSupplyDays).toHaveBeenCalledTimes(3)
  })

  it('gibt Fehler des Speicherns unverändert weiter', async () => {
    const writer = createFakeStockWriter({ foodTypes: { [householdId]: [] } })
    const readSupplyDays = vi.fn(() => Promise.resolve({ energyDays: 1, waterDays: 1 }))

    const result = await createStockWithSupply(
      { writer, now: () => now, readSupplyDays, logWarning: vi.fn() },
      { householdId, userId, draft },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'not-found', reference: 'food-type' } })
    expect(readSupplyDays).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['vor', [new Error('DB weg')]],
    ['nach', [{ energyDays: 1, waterDays: 1 }, new Error('DB weg')]],
  ])('speichert, auch wenn das Lesen der Tage %s dem Speichern scheitert', async (_, steps) => {
    const { save, readSupplyDays, logWarning } = setup()
    for (const step of steps) {
      if (step instanceof Error) readSupplyDays.mockRejectedValueOnce(step)
      else readSupplyDays.mockResolvedValueOnce(step)
    }

    expect(await save()).toMatchObject({ ok: true, value: { unitCount: 6, supplyChange: null } })
    expect(logWarning).toHaveBeenCalledOnce()
  })
})
