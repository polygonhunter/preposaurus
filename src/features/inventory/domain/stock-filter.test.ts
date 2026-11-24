import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  countByStatusFilter,
  displayStateOf,
  matchesStatusFilter,
  mostUrgentState,
  type FilterableUnit,
} from './stock-filter'
import type { NutritionGap } from './incomplete'
import { DEFAULT_AMPEL_THRESHOLDS } from '../../../../tests/helpers/ampel-thresholds'
import type { UnitStatus } from './unit'

const context = { today: toCalendarDay('2026-11-22'), thresholds: DEFAULT_AMPEL_THRESHOLDS }

interface Options {
  status?: UnitStatus
  checkedAt?: string
  nutritionGap?: NutritionGap
}

function unit(bestBefore: string | null, options: Options = {}): FilterableUnit {
  return {
    status: options.status ?? 'stock',
    bestBefore:
      bestBefore === null
        ? null
        : { date: toCalendarDay(bestBefore), precision: 'day', isEstimated: false },
    checkedAt: options.checkedAt === undefined ? null : toCalendarDay(options.checkedAt),
    nutritionGap: options.nutritionGap ?? null,
  }
}

const good = unit('2028-01-31')
const soon = unit('2027-01-31')
const urgent = unit('2026-12-01')
const expired = unit('2026-11-20')
const stillGood = unit('2026-11-20', { checkedAt: '2026-11-21' })
const withoutDate = unit(null)
const withGap = unit('2028-01-31', { nutritionGap: 'missing' })
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
    const gapConsumed = unit(null, { status: 'consumed', nutritionGap: 'unconfirmed' })
    const matches = [withoutDate, withGap, good, gapConsumed].map((entry) =>
      matchesStatusFilter(entry, 'incomplete', context),
    )

    expect(matches).toEqual([true, true, false, false])
  })

  it('lässt verbrauchte und entsorgte Packungen aus jedem Filter heraus', () => {
    expect(matchesStatusFilter(consumed, 'in-stock', context)).toBe(false)
    expect(matchesStatusFilter(consumed, 'due-soon', context)).toBe(false)
    expect(matchesStatusFilter(discarded, 'expired', context)).toBe(false)
  })
})

describe('countByStatusFilter', () => {
  it('zählt jede Packung im Vorrat in jedem passenden Chip-Filter', () => {
    const richtwert = unit('2028-01-31', { nutritionGap: 'no-label' })
    const units = [
      good,
      soon,
      urgent,
      expired,
      stillGood,
      withoutDate,
      withGap,
      richtwert,
      consumed,
      discarded,
    ]

    expect(countByStatusFilter(units, context)).toEqual({
      'in-stock': 8,
      'due-soon': 2,
      expired: 1,
      incomplete: 2,
    })
  })

  it('zählt bei leerem Vorrat überall 0', () => {
    expect(countByStatusFilter([], context)).toEqual({
      'in-stock': 0,
      'due-soon': 0,
      expired: 0,
      incomplete: 0,
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
