import { describe, expect, it } from 'vitest'
import { pickGapExamples } from './gap-examples'

// Frei gewählte Testdaten, in der Reihenfolge des Katalogs.
const foodTypes = [
  { groupKey: 'getreide', name: 'Reis', isStocked: false },
  { groupKey: 'getreide', name: 'Haferflocken', isStocked: false },
  { groupKey: 'getreide', name: 'Nudeln', isStocked: true },
  { groupKey: 'wasser', name: 'Sprudelwasser', isStocked: true },
]

describe('pickGapExamples', () => {
  it('nennt zuerst Arten aus dem Vorrat, dann den Katalog, höchstens zwei', () => {
    expect(pickGapExamples(foodTypes, 'getreide')).toEqual(['Nudeln', 'Reis'])
  })

  it('nimmt nur Arten der Warengruppe', () => {
    expect(pickGapExamples(foodTypes, 'wasser')).toEqual(['Sprudelwasser'])
  })

  it('nennt nichts, wenn die Warengruppe keine Arten hat', () => {
    expect(pickGapExamples(foodTypes, 'fette')).toEqual([])
  })

  it('nennt einen Namen nur einmal', () => {
    const twice = [
      { groupKey: 'obst', name: 'Äpfel', isStocked: true },
      { groupKey: 'obst', name: 'Äpfel', isStocked: false },
    ]

    expect(pickGapExamples(twice, 'obst')).toEqual(['Äpfel'])
  })
})
