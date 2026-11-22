import { describe, expect, it } from 'vitest'
import { createFakeStockReader, product, unit } from '../../../../tests/helpers/fake-stock-reader'
import { createFakeUnitWriter } from '../../../../tests/helpers/fake-unit-writer'
import type { UnitWriter } from './unit-writer'
import { takeOne } from './take-one'

const householdId = 'haushalt-a'
const now = new Date('2026-11-22T10:00:00Z')
const spaghetti = { kind: 'food-type' as const, id: 'art-spaghetti' }

function setup() {
  const units = [
    unit('nudeln', null),
    unit('nudeln', '2027-09-30'),
    unit('nudeln', '2027-03-31'),
    unit('nudeln', '2026-12-01', { status: 'consumed' }),
  ]
  const data = { householdId, products: [product({ id: 'nudeln' })], units }
  return { units, reader: createFakeStockReader(data), writer: createFakeUnitWriter(data) }
}

describe('takeOne („−1“ in der Vorratszeile)', () => {
  it('nimmt die Packung mit dem frühesten MHD im Vorrat und merkt Nutzer und Zeitpunkt', async () => {
    const { units, reader, writer } = setup()

    const result = await takeOne(
      { reader, writer },
      { householdId, userId: 'nutzer-1', target: spaghetti, now },
    )

    expect(result).toEqual({
      ok: true,
      value: { unitId: units[2]?.id, bestBefore: units[2]?.bestBefore },
    })
    expect(units[2]?.status).toBe('consumed')
    expect(writer.calls).toEqual([
      { householdId, unitId: units[2]?.id, status: 'consumed', userId: 'nutzer-1', at: now },
    ])
  })

  it('nimmt Packungen ohne Datum erst, wenn keine mit Datum mehr da ist', async () => {
    const { units, reader, writer } = setup()
    const input = { householdId, userId: 'nutzer-1', target: spaghetti, now }

    await takeOne({ reader, writer }, input)
    await takeOne({ reader, writer }, input)
    const third = await takeOne({ reader, writer }, input)

    expect(third.ok && third.value).toEqual({ unitId: units[0]?.id, bestBefore: null })
  })

  it('meldet „leer“, wenn nichts mehr im Vorrat ist', async () => {
    const { reader, writer } = setup()
    const input = { householdId, userId: 'nutzer-1', target: spaghetti, now }
    for (let i = 0; i < 3; i += 1) await takeOne({ reader, writer }, input)

    expect(await takeOne({ reader, writer }, input)).toEqual({
      ok: false,
      error: { kind: 'empty' },
    })
  })

  it('kennt fremde und unbekannte Zeilen nicht', async () => {
    const { reader, writer } = setup()

    const foreign = await takeOne(
      { reader, writer },
      { householdId: 'haushalt-b', userId: 'nutzer-1', target: spaghetti, now },
    )
    const unknown = await takeOne(
      { reader, writer },
      { householdId, userId: 'nutzer-1', target: { kind: 'product', id: 'gibt-es-nicht' }, now },
    )

    expect(foreign).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(unknown).toEqual({ ok: false, error: { kind: 'not-found' } })
  })

  it('nimmt die nächste Packung, wenn ein anderes Gerät schneller war', async () => {
    const { units, reader, writer } = setup()
    // Das erste bedingte Update verliert: Die Packung ist inzwischen woanders entnommen worden
    let isFirst = true
    const racingWriter: UnitWriter = {
      ...writer,
      takeOut: (household, change) => {
        if (isFirst) {
          isFirst = false
          const taken = units.find((entry) => entry.id === change.unitId)
          if (taken) taken.status = 'consumed'
          return Promise.resolve('not-in-stock')
        }
        return writer.takeOut(household, change)
      },
    }

    const result = await takeOne(
      { reader, writer: racingWriter },
      { householdId, userId: 'nutzer-1', target: spaghetti, now },
    )

    expect(result.ok && result.value.unitId).toBe(units[1]?.id)
  })

  it('gibt nach mehreren verlorenen Versuchen auf, statt endlos zu wiederholen', async () => {
    const { reader, writer } = setup()
    const alwaysLosing: UnitWriter = {
      ...writer,
      takeOut: () => Promise.resolve('not-in-stock'),
    }

    const result = await takeOne(
      { reader, writer: alwaysLosing },
      { householdId, userId: 'nutzer-1', target: spaghetti, now },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'empty' } })
  })
})
