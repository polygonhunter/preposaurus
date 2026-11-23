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
const targetDay = toCalendarDay('2027-01-01')
const householdId = 'haushalt-a'

const waterGap = {
  groupKey: 'wasser',
  name: 'Wasser',
  missing: { value: 20_000, unit: 'ml' as const },
  days: 6,
  goalDays: 10,
}

const milk = {
  productId: 'b1a0c7e2-0000-4000-8000-0000000000a1',
  rowKey: 'food-type:h-milch',
  label: 'H-Milch',
  status: 'stock' as const,
  bestBefore: toCalendarDay('2026-12-01'),
  takenOn: null,
}

interface Options {
  gaps?: (typeof waterGap)[]
  isCalculable?: boolean
  goalDay?: ReturnType<typeof toCalendarDay> | null
}

function ports({ gaps = [waterGap], isCalculable = true, goalDay = targetDay }: Options = {}) {
  const repository = createFakeRestockRepository({
    items: [
      storedItem({
        id: 'b1a0c7e2-0000-4000-8000-000000000001',
        householdId,
        source: 'nachkauf',
        productId: 'b1a0c7e2-0000-4000-8000-0000000000a2',
        foodTypeId: 'b1a0c7e2-0000-4000-8000-0000000000b1',
      }),
      storedItem({
        id: 'b1a0c7e2-0000-4000-8000-000000000002',
        householdId,
        status: 'erledigt',
        doneAt: new Date('2026-11-21T10:00:00Z'),
      }),
      storedItem({ id: 'b1a0c7e2-0000-4000-8000-000000000003', householdId: 'haushalt-b' }),
    ],
    replacementUnits: [milk],
    foodTypes: [{ groupKey: 'wasser', name: 'Sprudelwasser', isStocked: true }],
  })
  const goalGaps = { isCalculable, gaps, targetDay: goalDay }
  return { repository, loadGoalGaps: () => Promise.resolve(goalGaps) }
}

describe('getRestockList', () => {
  it('liefert Einträge, Lücken mit Beispielen und Vorschläge, passend zum Schema', async () => {
    const list = await getRestockList(ports(), { householdId, today })

    expect(restockListSchema.parse(list)).toEqual(list)
    expect(list.gaps).toEqual([{ ...waterGap, examples: ['Sprudelwasser'] }])
    expect(list.replace).toHaveLength(1)
    expect(list.replace[0]?.captureTarget).toEqual({
      kind: 'food-type',
      id: 'b1a0c7e2-0000-4000-8000-0000000000b1',
    })
    expect(list.suggestions).toEqual([
      {
        rowKey: milk.rowKey,
        productId: milk.productId,
        label: 'H-Milch',
        reason: { kind: 'expires', count: 1, firstDay: '2026-12-01' },
      },
    ])
    expect(list.done).toHaveLength(1)
    expect(list.done[0]?.captureTarget).toBeNull()
    expect(list.openItemCount).toBe(1)
  })

  it('zeigt nur Einträge des eigenen Haushalts', async () => {
    const list = await getRestockList(ports(), { householdId, today })
    const ids = [...list.replace, ...list.own, ...list.done].map(({ id }) => id)

    expect(ids).not.toContain('b1a0c7e2-0000-4000-8000-000000000003')
  })

  it('lässt eine geschlossene Lücke einfach weg, gespeichert wird nichts', async () => {
    const setup = ports({ gaps: [] })

    const list = await getRestockList(setup, { householdId, today })

    expect(list.gaps).toEqual([])
    expect(list.openItemCount).toBe(1)
    expect(setup.repository.items).toHaveLength(3)
  })

  it('schlägt ohne Zieldatum nichts vor, was nur vor dem Ziel abläuft', async () => {
    const list = await getRestockList(ports({ goalDay: null }), { householdId, today })

    expect(list.suggestions).toEqual([])
  })

  it('meldet, wenn es ohne Ziel nichts zu rechnen gibt', async () => {
    const list = await getRestockList(ports({ gaps: [], isCalculable: false }), {
      householdId,
      today,
    })

    expect(list.isGoalCalculable).toBe(false)
  })
})
