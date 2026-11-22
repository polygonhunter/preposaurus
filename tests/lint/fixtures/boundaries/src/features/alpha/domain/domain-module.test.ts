import { expect, it } from 'vitest'
import { marker } from './domain-module'

it('liefert den Marker', () => {
  expect(marker).toBe('fixture')
})
