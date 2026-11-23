import { describe, expect, it } from 'vitest'
import { updateProductSchema } from './product-edit'

const input = {
  productId: '0b8f7a52-3c39-4a7e-9d43-6f1a2b3c4d5e',
  foodTypeId: '1c9e8b63-4d4a-4b8f-8e54-7a2b3c4d5e6f',
  name: 'Spaghetti',
  content: { value: 500, unit: 'g' },
  containerId: null,
  storageLocationId: null,
  nutrition: { kcal: null, protein: null, carbs: null, fat: null },
  confirmEstimate: false,
}

describe('updateProductSchema', () => {
  it('nimmt eine leere Bezeichnung als „Name der Lebensmittelart“', () => {
    expect(updateProductSchema.parse({ ...input, name: '   ' }).name).toBeNull()
  })

  it('behält eine echte Bezeichnung ohne Leerzeichen am Rand', () => {
    expect(updateProductSchema.parse({ ...input, name: ' Spaghetti ' }).name).toBe('Spaghetti')
  })
})
