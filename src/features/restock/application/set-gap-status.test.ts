import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { createFakeRestockRepository } from '../../../../tests/helpers/fake-restock-repository'
import { getRestockList } from './get-restock-list'
import { setGapStatus } from './set-gap-status'

// Frei gewählte Testdaten.
const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'

const waterGap = {
  groupKey: 'wasser',
  name: 'Wasser',
  missing: { value: 20_000, unit: 'ml' as const },
  days: 6,
  goalDays: 10,
}

function setup(gaps = [waterGap]) {
  const repository = createFakeRestockRepository({ groupKeys: ['wasser', 'getreide'] })
  const goalGaps = { isCalculable: true, gaps, targetDay: null }
  return { repository, loadGoalGaps: () => Promise.resolve(goalGaps) }
}

describe('setGapStatus', () => {
  it('speichert die Lücke mit der Fehlmenge dieses Moments, die Liste verdeckt sie', async () => {
    const ports = setup()

    const result = await setGapStatus(ports, {
      householdId,
      today,
      groupKey: 'wasser',
      status: 'ausgeblendet',
    })

    expect(result).toEqual({ ok: true, value: { entryId: 'ziel-1', label: 'Wasser' } })
    expect(ports.repository.items).toMatchObject([
      { source: 'ziel', status: 'ausgeblendet', groupKey: 'wasser', amount: waterGap.missing },
    ])
    const list = await getRestockList(ports, { householdId, today })
    expect(list.gaps).toEqual([])
    expect(list.hiddenGaps).toMatchObject([{ entryId: 'ziel-1', name: 'Wasser' }])
    expect(list.belowGoalCount).toBe(1)
  })

  it('ersetzt beim zweiten Tipp den Eintrag, statt einen zweiten anzulegen', async () => {
    const ports = setup()
    const input = { householdId, today, groupKey: 'wasser', status: 'erledigt' as const }

    await setGapStatus(ports, input)
    const again = await setGapStatus(ports, input)

    expect(again).toEqual({ ok: true, value: { entryId: 'ziel-1', label: 'Wasser' } })
    expect(ports.repository.items).toHaveLength(1)
  })

  it('hakt eine schon geschlossene Lücke nicht ab', async () => {
    const ports = setup([])

    const result = await setGapStatus(ports, {
      householdId,
      today,
      groupKey: 'wasser',
      status: 'erledigt',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(ports.repository.items).toHaveLength(0)
  })

  it('kennt keine Warengruppe, die es nicht gibt', async () => {
    const ports = setup([{ ...waterGap, groupKey: 'unbekannt' }])

    const result = await setGapStatus(ports, {
      householdId,
      today,
      groupKey: 'unbekannt',
      status: 'erledigt',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})
