import { describe, expect, it } from 'vitest'
import { stockFilterSchema } from '../schemas'
import { dueHref, isHitMode, readDueSort, readStockParams, stockHref } from './stock-paths'

const filterOf = (params: Record<string, string | string[] | undefined>) =>
  stockFilterSchema.parse(readStockParams(params))

const ID = '11111111-1111-4111-8111-111111111111'

describe('Adressen im Vorrat', () => {
  it('liest deutsche Parameter in den Filter, leere Felder gelten als nicht gesetzt', () => {
    expect(
      filterOf({ suche: 'nudel', zustand: 'bald-faellig', behaelter: '', lagerort: ID }),
    ).toEqual({
      status: 'due-soon',
      search: 'nudel',
      storageLocationId: ID,
    })
    expect(filterOf({ suche: ['reis', 'mehl'] }).search).toBe('reis')
  })

  it('lässt einen unbekannten Zustand für die Prüfung stehen', () => {
    expect(stockFilterSchema.safeParse(readStockParams({ zustand: 'kaputt' })).success).toBe(false)
  })

  it('schreibt den Filter zurück in die Adresse und lässt den Standard weg', () => {
    expect(stockHref({ status: 'in-stock' })).toBe('/vorrat')
    expect(
      stockHref({ search: 'nu', status: 'expired', containerId: ID, storageLocationId: ID }),
    ).toBe(`/vorrat?suche=nu&zustand=abgelaufen&behaelter=${ID}&lagerort=${ID}`)
  })

  it('kennt den Treffermodus', () => {
    expect(isHitMode(filterOf({}))).toBe(false)
    expect(isHitMode(filterOf({ suche: 'nu' }))).toBe(true)
    expect(isHitMode(filterOf({ zustand: 'unvollstaendig' }))).toBe(true)
    expect(isHitMode(filterOf({ behaelter: ID }))).toBe(true)
  })

  it('merkt sich die Sortierung von Bald fällig in der Adresse', () => {
    expect(dueHref('date')).toBe('/uebersicht/bald-faellig')
    expect(dueHref('location')).toBe('/uebersicht/bald-faellig?sortierung=lagerort')
    expect(readDueSort({ sortierung: 'lagerort' })).toBe('location')
    expect(readDueSort({})).toBe('date')
  })
})
