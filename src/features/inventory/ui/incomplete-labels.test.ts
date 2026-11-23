import { describe, expect, it } from 'vitest'
import type { StockSearchRow } from '../schemas/stock'
import { incompleteNote } from './incomplete-labels'

const row = (
  packagesInStock: number,
  incomplete: StockSearchRow['incomplete'],
): Pick<StockSearchRow, 'packagesInStock' | 'incomplete'> => ({ packagesInStock, incomplete })

describe('incompleteNote', () => {
  it('nennt den Grund ohne Zahl, wenn er alle Packungen der Zeile betrifft', () => {
    expect(incompleteNote(row(2, [{ reason: 'nutrition-missing', packages: 2 }]))).toBe(
      'Nährwerte fehlen',
    )
  })

  it('nennt den Anteil, wenn nur ein Teil der Packungen betroffen ist', () => {
    expect(incompleteNote(row(3, [{ reason: 'date-missing', packages: 1 }]))).toBe(
      'Datum fehlt (1 von 3)',
    )
  })

  it('reiht mehrere Gründe in der Reihenfolge der Fachlogik', () => {
    const note = incompleteNote(
      row(4, [
        { reason: 'date-missing', packages: 1 },
        { reason: 'estimate-unconfirmed', packages: 4 },
      ]),
    )

    expect(note).toBe('Datum fehlt (1 von 4) · Schätzung bestätigen')
  })

  it('liefert null für eine vollständige Zeile', () => {
    expect(incompleteNote(row(2, []))).toBeNull()
  })
})
