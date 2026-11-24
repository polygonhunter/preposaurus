import { describe, expect, it } from 'vitest'
import { historyFilterSchema } from '../schemas/history'
import { historyDayLabel, historyRangeText, outcomeLine } from './history-labels'
import { historyHref, readHistoryParams } from './history-paths'

const typeId = '00000000-0000-4000-8000-0000000000a1'

describe('historyHref und readHistoryParams', () => {
  it('lässt den Standard-Zeitraum aus der Adresse weg', () => {
    expect(historyHref({ period: '30-days' })).toBe('/vorrat/verlauf')
    expect(historyHref({ outcome: 'discarded', period: '12-months' })).toBe(
      '/vorrat/verlauf?ausgang=entsorgt&zeitraum=12-monate',
    )
  })

  it('liest die Adresse wieder in denselben Filter zurück', () => {
    const filter = {
      outcome: 'consumed',
      period: 'all',
      target: { kind: 'food-type', id: typeId },
    } as const
    const href = historyHref(filter)
    const params = Object.fromEntries(new URL(href, 'http://localhost').searchParams)

    expect(href).toBe(`/vorrat/verlauf?art=${typeId}&ausgang=verbraucht&zeitraum=alles`)
    expect(historyFilterSchema.parse(readHistoryParams(params))).toEqual(filter)
  })

  it('lässt unbekannte Werte vom Schema ablehnen', () => {
    expect(historyFilterSchema.safeParse(readHistoryParams({ zeitraum: 'ewig' })).success).toBe(
      false,
    )
    expect(historyFilterSchema.safeParse(readHistoryParams({ produkt: 'kaputt' })).success).toBe(
      false,
    )
  })
})

describe('Texte des Verlaufs', () => {
  it('nennt den Tag mit Wochentag', () => {
    expect(historyDayLabel('2026-11-23')).toBe('Montag, 23.11.2026')
  })

  it('nennt Ausgang und Person, ohne Person nur den Ausgang', () => {
    const item = {
      unitId: 'a',
      outcome: 'discarded',
      target: { kind: 'product', id: 'b' },
      name: 'Walnüsse',
      bestBefore: null,
    } as const
    expect(outcomeLine({ ...item, person: 'Alex' })).toBe('Entsorgt · Alex')
    expect(outcomeLine({ ...item, person: null })).toBe('Entsorgt')
  })

  it('sagt, seit wann der Verlauf reicht', () => {
    expect(historyRangeText('2026-10-26')).toBe('Seit 26.10.2026.')
    expect(historyRangeText(null)).toBe('Alles, was ihr verbraucht oder entsorgt habt.')
  })
})
