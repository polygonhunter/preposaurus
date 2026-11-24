import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { unit } from '../../../../tests/helpers/fake-stock-reader'
import { createFakeUnitDateEditor } from '../../../../tests/helpers/fake-unit-date-editor'
import { unitDateGroupSchema } from '../schemas/detail'
import { changeUnitDates } from './change-unit-dates'
import { getUnitDateGroup } from './get-unit-date-group'

const householdId = 'haushalt-a'
const UNKNOWN = '00000000-0000-4000-8000-000000000000'
const FOOD_TYPE_ID = '44444444-4444-4444-8444-444444444444'

function setup() {
  const units = [
    unit('linsen', '2026-10-01', { checkedAt: '2026-11-10' }),
    unit('linsen', '2026-10-01', { checkedAt: '2026-11-10' }),
    unit('linsen', null),
    unit('linsen', '2027-05-31'),
    unit('linsen', '2026-10-01', { status: 'consumed' }),
    // Die Seite prüft IDs als UUID, darum echte statt der Zähler-IDs des Helfers
  ].map((entry) => ({ ...entry, id: crypto.randomUUID() }))
  const editor = createFakeUnitDateEditor({
    householdId,
    products: [
      { id: 'linsen', name: 'Linsen 500 g', foodType: { id: FOOD_TYPE_ID, name: 'Linsen' } },
    ],
    units,
  })
  return { units, editor }
}

const idOf = (units: readonly { id: string }[], index: number) => units[index]?.id ?? ''

describe('changeUnitDates („Datum ändern“, #49)', () => {
  it('setzt das Monatsende und „Noch gut“ zurück, wenn sich der Tag ändert', async () => {
    const { units, editor } = setup()
    const unitIds = [idOf(units, 0), idOf(units, 1)]

    const result = await changeUnitDates(editor, {
      householdId,
      unitIds,
      bestBefore: { date: toCalendarDay('2027-09-01'), precision: 'month' },
      kind: 'best-before',
    })

    expect(result).toEqual({ ok: true, value: { changed: 2 } })
    expect(editor.units[0]).toMatchObject({
      bestBefore: { date: '2027-09-30', precision: 'month', isEstimated: false },
      checkedAt: null,
    })
  })

  it('behält „Noch gut“, wenn nur die Genauigkeit sich ändert', async () => {
    const { units, editor } = setup()

    await changeUnitDates(editor, {
      householdId,
      unitIds: [idOf(units, 0)],
      bestBefore: { date: toCalendarDay('2026-10-01'), precision: 'day' },
      kind: 'best-before',
    })

    expect(editor.units[0]?.checkedAt).toBe('2026-11-10')
  })

  it('trägt ein fehlendes Datum nach (#116)', async () => {
    const { units, editor } = setup()

    await changeUnitDates(editor, {
      householdId,
      unitIds: [idOf(units, 2)],
      bestBefore: { date: toCalendarDay('2028-01-01'), precision: 'year' },
      kind: 'best-before',
    })

    expect(editor.units[2]?.bestBefore).toEqual({
      date: '2028-12-31',
      precision: 'year',
      isEstimated: false,
    })
  })

  it('macht ein MHD zum Verbrauchsdatum, „Noch gut“ entfällt auch am selben Tag (#300)', async () => {
    const { units, editor } = setup()

    await changeUnitDates(editor, {
      householdId,
      unitIds: [idOf(units, 0)],
      bestBefore: { date: toCalendarDay('2026-10-01'), precision: 'day' },
      kind: 'use-by',
    })

    expect(editor.units[0]).toMatchObject({ kind: 'use-by', checkedAt: null })
    expect(editor.units[1]).toMatchObject({ kind: 'best-before', checkedAt: '2026-11-10' })
  })

  it('stuft ein Verbrauchsdatum auf Wunsch zum MHD zurück (#300)', async () => {
    const { units, editor } = setup()
    const unitIds = [idOf(units, 3)]
    const bestBefore = { date: toCalendarDay('2027-05-31'), precision: 'day' as const }
    await changeUnitDates(editor, { householdId, unitIds, bestBefore, kind: 'use-by' })

    await changeUnitDates(editor, { householdId, unitIds, bestBefore, kind: 'best-before' })

    expect(editor.units[3]?.kind).toBe('best-before')
  })

  it('ändert keine entnommene oder fremde Packung', async () => {
    const { units, editor } = setup()
    const bestBefore = { date: toCalendarDay('2027-01-01'), precision: 'day' as const }
    const kind = 'best-before' as const

    expect(
      await changeUnitDates(editor, { householdId, unitIds: [idOf(units, 4)], bestBefore, kind }),
    ).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(
      await changeUnitDates(editor, {
        householdId: 'haushalt-b',
        unitIds: [idOf(units, 0)],
        bestBefore,
        kind,
      }),
    ).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(editor.units[4]?.bestBefore?.date).toBe('2026-10-01')
  })
})

describe('getUnitDateGroup', () => {
  it('liefert alle Packungen im Vorrat mit demselben Datum', async () => {
    const { units, editor } = setup()

    const result = await getUnitDateGroup(editor, { householdId, unitId: idOf(units, 0) })

    expect(result.ok && unitDateGroupSchema.parse(result.value)).toEqual(result.ok && result.value)
    expect(result.ok && result.value).toMatchObject({
      target: { kind: 'food-type', id: FOOD_TYPE_ID },
      name: 'Linsen',
      productName: 'Linsen 500 g',
      unitIds: [idOf(units, 0), idOf(units, 1)],
      checkedCount: 2,
    })
  })

  it('nennt eine gemischte Zeile Verbrauchsdatum, auch von einer MHD-Packung aus (#294)', async () => {
    const units = [
      unit('linsen', '2026-12-03'),
      unit('linsen', '2026-12-03', { kind: 'use-by' }),
    ].map((entry) => ({ ...entry, id: crypto.randomUUID() }))
    const editor = createFakeUnitDateEditor({
      householdId,
      products: [{ id: 'linsen', name: 'Linsen 500 g', foodType: null }],
      units,
    })

    const result = await getUnitDateGroup(editor, { householdId, unitId: idOf(units, 0) })

    expect(result.ok && result.value.kind).toBe('use-by')
  })

  it('findet die Zeile „Datum fehlt“', async () => {
    const { units, editor } = setup()

    const result = await getUnitDateGroup(editor, { householdId, unitId: idOf(units, 2) })

    expect(result.ok && result.value).toMatchObject({ bestBefore: null, unitIds: [idOf(units, 2)] })
  })

  it('ist „nicht gefunden“ für kaputte, fremde und entnommene Packungen', async () => {
    const { units, editor } = setup()
    const notFound = { ok: false, error: { kind: 'not-found' } }

    expect(await getUnitDateGroup(editor, { householdId, unitId: 'kaputt' })).toEqual(notFound)
    expect(await getUnitDateGroup(editor, { householdId, unitId: UNKNOWN })).toEqual(notFound)
    expect(
      await getUnitDateGroup(editor, { householdId: 'haushalt-b', unitId: idOf(units, 0) }),
    ).toEqual(notFound)
    expect(await getUnitDateGroup(editor, { householdId, unitId: idOf(units, 4) })).toEqual(
      notFound,
    )
  })
})
