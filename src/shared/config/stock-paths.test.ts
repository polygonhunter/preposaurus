import { describe, expect, it } from 'vitest'
import { detailPath, prefilledCapturePath, productEditPath, unitDatePath } from './stock-paths'

const ID = '11111111-1111-4111-8111-111111111111'

describe('Adressen rund um eine Zeile im Vorrat', () => {
  it('führt zur Lebensmittelart bzw. zum Produkt ohne Art', () => {
    expect(detailPath({ kind: 'food-type', id: ID })).toBe(`/vorrat/art/${ID}`)
    expect(detailPath({ kind: 'product', id: ID })).toBe(`/vorrat/produkt/${ID}`)
  })

  it('führt zu Bearbeiten und Datum ändern', () => {
    expect(productEditPath(ID)).toBe(`/vorrat/produkt/${ID}/bearbeiten`)
    expect(unitDatePath(ID)).toBe(`/vorrat/packung/${ID}/datum`)
  })

  it('belegt das Erfassen mit Lebensmittelart oder Produkt vor', () => {
    expect(prefilledCapturePath({ kind: 'food-type', id: ID })).toBe(`/neu/manuell?art=${ID}`)
    expect(prefilledCapturePath({ kind: 'product', id: ID })).toBe(`/neu/manuell?produkt=${ID}`)
    expect(prefilledCapturePath(null)).toBe('/neu')
  })
})
