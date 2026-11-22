import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { dueItem } from '../../../../tests/helpers/due-items'
import { buildUrgentMessage, selectNewUrgentItems } from './urgent'

const today = toCalendarDay('2026-11-22')

describe('selectNewUrgentItems', () => {
  it('nimmt nur die Gruppe „Diese Woche“', () => {
    const items = [
      dueItem('Thunfisch', '2026-11-29'),
      dueItem('Reis', '2026-11-20', { group: 'expired' }),
      dueItem('Mehl', '2026-12-10', { group: 'this-month' }),
    ]
    const selected = selectNewUrgentItems(items, { lastSentAt: null })
    expect(selected.map((item) => item.label)).toEqual(['Thunfisch'])
  })

  it('meldet nur, was seit dem letzten Versand in „Diese Woche“ gerutscht ist', () => {
    const lastSentAt = new Date('2026-11-21T07:00:00Z')
    const items = [
      // lag am 21.11. schon in „Diese Woche“ (bis 28.11.)
      dueItem('Reis', '2026-11-28'),
      // kam heute neu in die Gruppe
      dueItem('Thunfisch', '2026-11-29'),
    ]
    const selected = selectNewUrgentItems(items, { lastSentAt })
    expect(selected.map((item) => item.label)).toEqual(['Thunfisch'])
  })

  it('meldet einen Eintrag erneut, wenn seither eine Packung dazukam', () => {
    const lastSentAt = new Date('2026-11-21T07:00:00Z')
    const items = [dueItem('Reis', '2026-11-25', { latestAddedAt: '2026-11-22T10:00:00Z' })]
    expect(selectNewUrgentItems(items, { lastSentAt })).toHaveLength(1)
  })

  it('meldet eine Packung, die am Tag des Versands erst danach erfasst wurde', () => {
    const lastSentAt = new Date('2026-11-21T07:00:00Z')
    const items = [dueItem('Reis', '2026-11-25', { latestAddedAt: '2026-11-21T15:00:00Z' })]
    expect(selectNewUrgentItems(items, { lastSentAt })).toHaveLength(1)
  })

  it('meldet keine Packung erneut, die vor dem Versand am selben Tag erfasst wurde', () => {
    const lastSentAt = new Date('2026-11-21T07:00:00Z')
    const items = [dueItem('Reis', '2026-11-25', { latestAddedAt: '2026-11-21T06:00:00Z' })]
    expect(selectNewUrgentItems(items, { lastSentAt })).toHaveLength(0)
  })
})

describe('buildUrgentMessage', () => {
  it('schickt nichts, wenn nichts Neues dringend ist', () => {
    expect(buildUrgentMessage([], today)).toBeNull()
  })

  it('nennt eine einzelne Packung mit Restzeit', () => {
    expect(buildUrgentMessage([dueItem('Thunfisch', '2026-11-29')], today)).toEqual({
      kind: 'urgent',
      title: 'Bald verbrauchen',
      lines: ['Thunfisch läuft in 7 Tagen ab.'],
      target: 'due',
    })
  })

  it('nennt die Anzahl, wenn ein Eintrag mehrere Packungen hat', () => {
    const message = buildUrgentMessage([dueItem('Reis', '2026-11-23', { unitCount: 3 })], today)
    expect(message?.lines).toEqual(['Reis (3 Packungen) läuft morgen ab.'])
  })

  it('bündelt mehrere Einträge in einer Nachricht statt einer je Packung', () => {
    const items = [
      dueItem('Reis', '2026-11-27', { unitCount: 2 }),
      dueItem('Thunfisch', '2026-11-24'),
      dueItem('Linsen', '2026-11-25'),
    ]
    expect(buildUrgentMessage(items, today)?.lines).toEqual([
      '4 Packungen diese Woche verbrauchen: Thunfisch, Linsen und Reis.',
      'Als Erstes: Thunfisch läuft in 2 Tagen ab.',
    ])
  })
})
