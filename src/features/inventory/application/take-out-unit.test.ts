import { describe, expect, it } from 'vitest'
import { unit } from '../../../../tests/helpers/fake-stock-reader'
import { createFakeUnitWriter } from '../../../../tests/helpers/fake-unit-writer'
import { returnToStock } from './return-to-stock'
import { takeOutUnit } from './take-out-unit'

const householdId = 'haushalt-a'
const now = new Date('2026-11-22T10:00:00Z')

function setup() {
  const units = [unit('nudeln', '2027-03-31')]
  return { units, writer: createFakeUnitWriter({ householdId, units }) }
}

describe('takeOutUnit („Verbraucht“ bzw. „Entsorgt“ für eine Packung)', () => {
  it('setzt die Packung auf verbraucht, mit Nutzer und Zeitpunkt', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''

    const result = await takeOutUnit(writer, {
      householdId,
      userId: 'nutzer-1',
      unitId,
      outcome: 'consumed',
      now,
    })

    expect(result).toEqual({ ok: true, value: { unitId } })
    expect(units[0]?.status).toBe('consumed')
    expect(writer.calls).toEqual([
      { householdId, unitId, status: 'consumed', userId: 'nutzer-1', at: now },
    ])
  })

  it('setzt die Packung bei „Entsorgt“ auf entsorgt, mit Nutzer und Zeitpunkt', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''

    const result = await takeOutUnit(writer, {
      householdId,
      userId: 'nutzer-1',
      unitId,
      outcome: 'discarded',
      now,
    })

    expect(result).toEqual({ ok: true, value: { unitId } })
    expect(units[0]?.status).toBe('discarded')
    expect(writer.calls).toEqual([
      { householdId, unitId, status: 'discarded', userId: 'nutzer-1', at: now },
    ])
  })

  it('ändert eine doppelt entnommene Packung nur einmal', async () => {
    const { units, writer } = setup()
    const input = {
      householdId,
      userId: 'nutzer-1',
      unitId: units[0]?.id ?? '',
      outcome: 'consumed' as const,
      now,
    }

    await takeOutUnit(writer, input)
    const second = await takeOutUnit(writer, input)

    expect(second).toEqual({ ok: false, error: { kind: 'not-in-stock' } })
  })

  it('kennt fremde Packungen nicht', async () => {
    const { units, writer } = setup()

    const result = await takeOutUnit(writer, {
      householdId: 'haushalt-b',
      userId: 'nutzer-1',
      unitId: units[0]?.id ?? '',
      outcome: 'discarded',
      now,
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(units[0]?.status).toBe('stock')
  })
})

describe('returnToStock (Rückgängig)', () => {
  const userId = 'nutzer-1'

  it('holt die eigene verbrauchte Packung zurück in den Vorrat', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''
    await takeOutUnit(writer, { householdId, userId, unitId, outcome: 'consumed', now })

    expect(await returnToStock(writer, { householdId, userId, unitId })).toEqual({
      ok: true,
      value: { unitId },
    })
    expect(units[0]?.status).toBe('stock')
  })

  it('holt die eigene entsorgte Packung zurück in den Vorrat', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''
    await takeOutUnit(writer, { householdId, userId, unitId, outcome: 'discarded', now })

    expect((await returnToStock(writer, { householdId, userId, unitId })).ok).toBe(true)
    expect(units[0]?.status).toBe('stock')
  })

  it('nimmt eine Packung, die schon im Vorrat ist, ohne Fehler hin', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''

    expect(await returnToStock(writer, { householdId, userId, unitId })).toEqual({
      ok: true,
      value: { unitId },
    })
  })

  it('holt keine Packung zurück, die jemand anderes entnommen hat', async () => {
    const { units, writer } = setup()
    const unitId = units[0]?.id ?? ''
    await takeOutUnit(writer, {
      householdId,
      userId: 'nutzer-2',
      unitId,
      outcome: 'consumed',
      now,
    })

    const result = await returnToStock(writer, { householdId, userId, unitId })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(units[0]?.status).toBe('consumed')
  })

  it('kennt fremde Packungen nicht', async () => {
    const { units, writer } = setup()

    const result = await returnToStock(writer, {
      householdId: 'haushalt-b',
      userId,
      unitId: units[0]?.id ?? '',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})
