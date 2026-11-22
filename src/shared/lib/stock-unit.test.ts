import { describe, expect, it } from 'vitest'
import { isInStockWithoutDate } from './stock-unit'

const dated = { date: '2027-09-30' }

describe('isInStockWithoutDate', () => {
  it('erkennt Packungen im Vorrat ohne Datum', () => {
    expect(isInStockWithoutDate({ status: 'stock', bestBefore: null })).toBe(true)
    expect(isInStockWithoutDate({ status: 'stock', bestBefore: dated })).toBe(false)
  })

  it('übergeht verbrauchte und entsorgte Packungen ohne Datum', () => {
    expect(isInStockWithoutDate({ status: 'consumed', bestBefore: null })).toBe(false)
    expect(isInStockWithoutDate({ status: 'discarded', bestBefore: null })).toBe(false)
  })
})
