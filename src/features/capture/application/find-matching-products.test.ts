import { describe, expect, it } from 'vitest'
import { createFakeStockWriter } from '../../../../tests/helpers/fake-stock-writer'
import type { ProductCandidate } from '../domain/stock-records'
import type { ProductMatchQuery } from '../schemas/stock'
import { findMatchingProducts } from './find-matching-products'

const NOODLES = '00000000-0000-4000-8000-000000000001'

const candidate = (overrides: Partial<ProductCandidate>): ProductCandidate => ({
  id: 'produkt',
  name: 'Spaghetti',
  foodTypeId: NOODLES,
  content: { value: 500, unit: 'g' },
  containerId: null,
  containerName: null,
  storageLocationName: null,
  ...overrides,
})

describe('findMatchingProducts', () => {
  it('schlägt nur Produkte mit gleicher Menge und gleichem Behälter vor, auch an zwei Orten', async () => {
    const writer = createFakeStockWriter({
      candidates: {
        'haushalt-a': [
          candidate({ id: 'keller', storageLocationName: 'Keller' }),
          candidate({ id: 'kueche', storageLocationName: 'Küche' }),
          candidate({ id: 'kilo', content: { value: 1000, unit: 'g' } }),
          candidate({ id: 'glas', containerId: 'glas' }),
        ],
      },
    })
    const query: ProductMatchQuery = {
      foodTypeId: NOODLES,
      content: { value: 500, unit: 'g' },
      containerId: null,
    }

    const matches = await findMatchingProducts(writer, { householdId: 'haushalt-a', query })

    expect(matches.map((match) => match.id)).toEqual(['keller', 'kueche'])
    expect(matches[0]).toEqual({
      id: 'keller',
      name: 'Spaghetti',
      content: { value: 500, unit: 'g' },
      containerName: null,
      storageLocationName: 'Keller',
    })
  })
})
