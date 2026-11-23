import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  createFakeRestockRepository,
  storedItem,
} from '../../../../tests/helpers/fake-restock-repository'
import { restockListSchema } from '../schemas'
import { getRestockList } from './get-restock-list'

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

function ports(gaps = [waterGap], isCalculable = true) {
  const repository = createFakeRestockRepository({
    items: [
      storedItem({
        id: 'b1a0c7e2-0000-4000-8000-000000000001',
        householdId,
        source: 'nachkauf',
        productId: 'b1a0c7e2-0000-4000-8000-0000000000a1',
        foodTypeId: 'b1a0c7e2-0000-4000-8000-0000000000b1',
      }),
      storedItem({ id: 'b1a0c7e2-0000-4000-8000-000000000002', householdId, isDone: true }),
      storedItem({ id: 'b1a0c7e2-0000-4000-8000-000000000003', householdId: 'haushalt-b' }),
    ],
  })
  return { repository, loadGoalGaps: () => Promise.resolve({ isCalculable, gaps }) }
}

describe('getRestockList', () => {
  it('liefert gespeicherte Einträge und live gerechnete Lücken, passend zum Schema', async () => {
    const list = await getRestockList(ports(), { householdId, today })

    expect(restockListSchema.parse(list)).toEqual(list)
    expect(list.gaps).toEqual([waterGap])
    expect(list.replace).toHaveLength(1)
    expect(list.replace[0]?.captureTarget).toEqual({
      kind: 'food-type',
      id: 'b1a0c7e2-0000-4000-8000-0000000000b1',
    })
    expect(list.done).toHaveLength(1)
    expect(list.done[0]?.captureTarget).toBeNull()
    expect(list.openCount).toBe(2)
  })

  it('zeigt nur Einträge des eigenen Haushalts', async () => {
    const list = await getRestockList(ports(), { householdId, today })
    const ids = [...list.replace, ...list.own, ...list.done].map(({ id }) => id)

    expect(ids).not.toContain('b1a0c7e2-0000-4000-8000-000000000003')
  })

  it('lässt eine geschlossene Lücke einfach weg, gespeichert wird sie nie', async () => {
    const setup = ports([])

    const list = await getRestockList(setup, { householdId, today })

    expect(list.gaps).toEqual([])
    expect(list.openCount).toBe(1)
    expect(setup.repository.items).toHaveLength(3)
  })

  it('meldet, wenn es ohne Ziel nichts zu rechnen gibt', async () => {
    const list = await getRestockList(ports([], false), { householdId, today })

    expect(list.isGoalCalculable).toBe(false)
  })
})
