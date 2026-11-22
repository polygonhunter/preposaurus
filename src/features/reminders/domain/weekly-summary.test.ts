import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { dueItem } from '../../../../tests/helpers/due-items'
import { buildWeeklySummary, type WeeklySummaryInput } from './weekly-summary'

const quiet: WeeklySummaryInput = {
  dueItems: [],
  missingDateCount: 0,
  goal: null,
  openRestockCount: 0,
}

const openGoal = { suppliedDays: 6.7, targetDays: 10, targetDate: toCalendarDay('2026-12-31') }

describe('buildWeeklySummary', () => {
  it('schickt nichts, wenn nichts fällig ist', () => {
    expect(buildWeeklySummary(quiet)).toBeNull()
  })

  it('schickt nichts, wenn nur ein Datum fehlt oder nur „In 3 Monaten“ fällig ist', () => {
    const later = dueItem('Reis', '2027-01-20', { group: 'next-three-months' })
    expect(buildWeeklySummary({ ...quiet, missingDateCount: 2, dueItems: [later] })).toBeNull()
  })

  it('schickt nichts, wenn das Ziel erreicht und sonst nichts offen ist', () => {
    const reached = { ...openGoal, suppliedDays: 12 }
    expect(buildWeeklySummary({ ...quiet, goal: reached })).toBeNull()
  })

  it('fasst die Woche in ruhigen Zeilen zusammen', () => {
    const message = buildWeeklySummary({
      dueItems: [
        dueItem('Mais', '2026-11-20', { group: 'expired' }),
        dueItem('Thunfisch', '2026-11-24'),
        dueItem('Reis', '2026-11-27', { unitCount: 2 }),
        dueItem('Mehl', '2026-12-10', { group: 'this-month', unitCount: 4 }),
      ],
      missingDateCount: 1,
      goal: openGoal,
      openRestockCount: 2,
    })
    expect(message).toEqual({
      kind: 'weekly-summary',
      title: 'Wochenübersicht',
      lines: [
        '1 Packung abgelaufen: kurz ansehen und entscheiden.',
        '3 Packungen diese Woche verbrauchen: Thunfisch und Reis.',
        '4 Packungen in den nächsten Wochen einplanen.',
        'Nachkaufen: 2 Einträge offen.',
        'Ziel 31.12.2026: 6 von 10 Tagen.',
        'Bei 1 Packung fehlt noch das Datum.',
      ],
      target: 'overview',
    })
  })

  it('erinnert an ein offenes Ziel, auch wenn sonst nichts fällig ist', () => {
    const goal = { ...openGoal, targetDate: null }
    expect(buildWeeklySummary({ ...quiet, goal })?.lines).toEqual(['Ziel: 6 von 10 Tagen.'])
  })

  it('nennt ein erreichtes Ziel freundlich, wenn es andere Anlässe gibt', () => {
    const goal = { ...openGoal, suppliedDays: 10 }
    const message = buildWeeklySummary({ ...quiet, goal, openRestockCount: 1 })
    expect(message?.lines).toEqual([
      'Nachkaufen: 1 Eintrag offen.',
      'Ziel erreicht: 10 von 10 Tagen.',
    ])
  })
})
