import { describe, expect, it } from 'vitest'
import { unit } from '../../../../tests/helpers/fake-stock-reader'
import { createFakeUnitWriter } from '../../../../tests/helpers/fake-unit-writer'
import { consumeUnit } from './consume-unit'
import { returnToStock } from './return-to-stock'

const householdId = 'haushalt-a'
const now = new Date('2026-11-22T10:00:00Z')

function setup() {
  const units = [unit('nudeln', '2027-03-31')]
  return { units, writer: createFakeUnitWriter({ householdId, units }) }
}

describe('consumeUnit („Verbraucht“ für eine Packung)', () => {
  it('setzt die Packung auf verbraucht, mit Nutzer und Zeitpunkt', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''

    const result = await consumeUnit(writer, { householdId, userId: 'nutzer-1', unitId, now })

    expect(result).toEqual({ ok: true, value: { unitId } })
    expect(units[0]?.status).toBe('consumed')
    expect(writer.calls).toEqual([
      { householdId, unitId, status: 'consumed', userId: 'nutzer-1', at: now },
    ])
  })

  it('ändert eine doppelt entnommene Packung nur einmal', async () => {
    const { units, writer } = setup()
    const input = { householdId, userId: null, unitId: units[0]?.id ?? '', now }

    await consumeUnit(writer, input)
    const second = await consumeUnit(writer, input)

    expect(second).toEqual({ ok: false, error: { kind: 'not-in-stock' } })
  })

  it('kennt fremde Packungen nicht', async () => {
    const { units, writer } = setup()

    const result = await consumeUnit(writer, {
      householdId: 'haushalt-b',
      userId: null,
      unitId: units[0]?.id ?? '',
      now,
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(units[0]?.status).toBe('stock')
  })
})

describe('returnToStock (Rückgängig)', () => {
  it('holt eine verbrauchte Packung zurück in den Vorrat', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''
    await consumeUnit(writer, { householdId, userId: null, unitId, now })

    expect(await returnToStock(writer, { householdId, unitId })).toEqual({
      ok: true,
      value: { unitId },
    })
    expect(units[0]?.status).toBe('stock')
  })

  it('nimmt eine Packung, die schon im Vorrat ist, ohne Fehler hin', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''

    expect(await returnToStock(writer, { householdId, unitId })).toEqual({
      ok: true,
      value: { unitId },
    })
  })

  it('kennt fremde Packungen nicht', async () => {
    const { units, writer } = setup()

    const result = await returnToStock(writer, {
      householdId: 'haushalt-b',
      unitId: units[0]?.id ?? '',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})
