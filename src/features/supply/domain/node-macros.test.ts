import { describe, expect, it } from 'vitest'
import { sumMacros, type PackageMacros } from './node-macros'
import { calculateNodeTotals } from './node-totals'
import { need, nodeUnit, penne, today } from '../../../../tests/helpers/node-units'

// TESTDATEN: Makros frei gewählt
const complete: PackageMacros = { protein: 10, carbs: 50, fat: 2 }
const withoutFat: PackageMacros = { protein: 4, carbs: 20, fat: null }
const none: PackageMacros = { protein: null, carbs: null, fat: null }

const macroUnit = (id: string, product: string | null, macros: PackageMacros) => ({
  id,
  path: { product },
  macros,
})

describe('sumMacros', () => {
  it('summiert vollständige Makros ohne Hinweis', () => {
    const units = [macroUnit('a', 'reis', complete), macroUnit('b', 'reis', complete)]
    expect(sumMacros(units)).toEqual({ protein: 20, carbs: 100, fat: 4, productsWithoutMacros: 0 })
  })

  it('zählt bekannte Makros mit und nennt das Produkt mit Lücke', () => {
    const units = [macroUnit('a', 'reis', complete), macroUnit('b', 'linsen', withoutFat)]
    expect(sumMacros(units)).toEqual({ protein: 14, carbs: 70, fat: 2, productsWithoutMacros: 1 })
  })

  it('zählt ein Produkt mit mehreren Packungen nur einmal', () => {
    const units = [
      macroUnit('a', 'linsen', withoutFat),
      macroUnit('b', 'linsen', withoutFat),
      macroUnit('c', 'bohnen', none),
    ]
    expect(sumMacros(units).productsWithoutMacros).toBe(2)
  })

  it('zählt Packungen ohne Produktzuordnung je einzeln', () => {
    const units = [macroUnit('a', null, none), macroUnit('b', null, none)]
    expect(sumMacros(units)).toEqual({ protein: 0, carbs: 0, fat: 0, productsWithoutMacros: 2 })
  })

  it('hält einen echten Wert 0 nicht für fehlend', () => {
    const zeroFat = { protein: 0, carbs: 0, fat: 0 }
    expect(sumMacros([macroUnit('a', 'wasser', zeroFat)]).productsWithoutMacros).toBe(0)
  })

  it('liefert für keine Packung überall 0', () => {
    expect(sumMacros([])).toEqual({ protein: 0, carbs: 0, fat: 0, productsWithoutMacros: 0 })
  })
})

describe('calculateNodeTotals mit fehlenden Makros', () => {
  const node = { level: 'category', key: 'nudeln' } as const

  it('nennt nur gezählte Produkte mit Lücke, abgelaufene fallen heraus', () => {
    const units = [
      nodeUnit(),
      nodeUnit({ path: penne, macros: withoutFat }),
      nodeUnit({ path: penne, macros: withoutFat }),
      nodeUnit({ path: penne, macros: none, bestBefore: '2026-01-31' }),
    ]
    const totals = calculateNodeTotals({
      stillGoodCounts: false,
      units,
      node,
      need,
      reference: today,
    })

    expect(totals.macros).toEqual({ protein: 73, carbs: 395, fat: 7.5 })
    expect(totals.productsWithoutMacros).toBe(1)
  })
})
