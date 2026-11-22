import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  countByStatusFilter,
  displayStateOf,
  matchesStatusFilter,
  mostUrgentState,
  type FilterableUnit,
} from './stock-filter'
import { DEFAULT_AMPEL_THRESHOLDS } from './unit-state'
import type { UnitStatus } from './unit'

const context = { today: toCalendarDay('2026-11-22'), thresholds: DEFAULT_AMPEL_THRESHOLDS }

interface Options {
  status?: UnitStatus
  checkedAt?: string
  hasNutritionGap?: boolean
}

function unit(bestBefore: string | null, options: Options = {}): FilterableUnit {
  return {
    status: options.status ?? 'stock',
    bestBefore:
      bestBefore === null
        ? null
        : { date: toCalendarDay(bestBefore), precision: 'day', isEstimated: false },
    checkedAt: options.checkedAt === undefined ? null : toCalendarDay(options.checkedAt),
    hasNutritionGap: options.hasNutritionGap ?? false,
  }
}

const good = unit('2028-01-31')
const soon = unit('2027-01-31')
const urgent = unit('2026-12-01')
const expired = unit('2026-11-20')
const stillGood = unit('2026-11-20', { checkedAt: '2026-11-21' })
const withoutDate = unit(null)
const withGap = unit('2028-01-31', { hasNutritionGap: true })
const consumed = unit('2027-01-31', { status: 'consumed' })
const discarded = unit('2026-11-01', { status: 'discarded' })

describe('displayStateOf', () => {
  it('zeigt eine „Noch gut“ geprüfte, abgelaufene Packung als gut', () => {
    expect(displayStateOf(expired, context)).toBe('expired')
    expect(displayStateOf(stillGood, context)).toBe('good')
    expect(displayStateOf(withoutDate, context)).toBe('no-date')
  })
})

describe('matchesStatusFilter', () => {
  it('zählt bald fällig und dringend zu „Bald fällig“, abgelaufen nicht', () => {
    const matches = [good, soon, urgent, expired].map((entry) =>
      matchesStatusFilter(entry, 'due-soon', context),
    )

    expect(matches).toEqual([false, true, true, false])
  })

  it('lässt „Noch gut“ geprüfte Packungen aus „Abgelaufen“ heraus', () => {
    expect(matchesStatusFilter(expired, 'expired', context)).toBe(true)
    expect(matchesStatusFilter(stillGood, 'expired', context)).toBe(false)
  })

  it('sammelt „Datum fehlt“ und Nährwert-Lücken unter „Unvollständig“, nur im Vorrat', () => {
    const gapConsumed = unit(null, { status: 'consumed', hasNutritionGap: true })
    const matches = [withoutDate, withGap, good, gapConsumed].map((entry) =>
      matchesStatusFilter(entry, 'incomplete', context),
    )

    expect(matches).toEqual([true, true, false, false])
  })

  it('trennt Vorrat, Verbraucht und Entsorgt nach gespeichertem Status', () => {
    expect(matchesStatusFilter(consumed, 'in-stock', context)).toBe(false)
    expect(matchesStatusFilter(consumed, 'consumed', context)).toBe(true)
    expect(matchesStatusFilter(discarded, 'discarded', context)).toBe(true)
    expect(matchesStatusFilter(discarded, 'expired', context)).toBe(false)
  })
})

describe('countByStatusFilter', () => {
  it('zählt jede Packung in jedem passenden Filter', () => {
    const units = [
      good,
      soon,
      urgent,
      expired,
      stillGood,
      withoutDate,
      withGap,
      consumed,
      discarded,
    ]

    expect(countByStatusFilter(units, context)).toEqual({
      'in-stock': 7,
      'due-soon': 2,
      expired: 1,
      incomplete: 2,
      consumed: 1,
      discarded: 1,
    })
  })
})

describe('mostUrgentState', () => {
  it('nimmt die dringendste Packung im Vorrat', () => {
    expect(mostUrgentState([good, soon, withoutDate], context)).toBe('soon')
    expect(mostUrgentState([good, expired, urgent], context)).toBe('expired')
  })

  it('nennt „Datum fehlt“ nur, wenn keine Packung ein Datum hat', () => {
    expect(mostUrgentState([withoutDate], context)).toBe('no-date')
    expect(mostUrgentState([withoutDate, stillGood], context)).toBe('good')
  })

  it('liefert null ohne Packung im Vorrat', () => {
    expect(mostUrgentState([], context)).toBeNull()
    expect(mostUrgentState([consumed], context)).toBeNull()
  })
})
