import type { NodeUnit, TreePath } from '@/features/supply/domain/node-totals'
import type { ReferenceDay } from '@/features/supply/domain/supply-rules'
import { toCalendarDay } from '@/shared/lib/dates'
import type { ContentQuantity } from '@/shared/lib/quantities'
import { supplyUnit } from './supply-units'

// Gemeinsame Testdaten für die Summen je Baumknoten. Alle Zahlen sind frei gewählte Testwerte.

export const today: ReferenceDay = { day: toCalendarDay('2026-11-22'), kind: 'today' }
export const target: ReferenceDay = { day: toCalendarDay('2027-03-31'), kind: 'target' }
// TESTDATEN: 1 Erwachsener mit den ungeprüften Konzeptwerten, 2.000 kcal und 2 l je Tag
export const need = { kcalPerDay: 2000, waterMlPerDay: 2000 }

// TESTDATEN: Pfade frei gewählt, so wie sie aus den Stammdaten kämen
const spaghetti: TreePath = {
  group: 'getreide',
  category: 'nudeln',
  foodType: 'spaghetti',
  product: 'spaghetti-500',
}
export const spaghettiBio: TreePath = { ...spaghetti, product: 'spaghetti-bio-500' }
export const penne: TreePath = { ...spaghetti, foodType: 'penne', product: 'penne-500' }
export const reis: TreePath = {
  ...spaghetti,
  category: 'reis',
  foodType: 'langkorn',
  product: 'reis-1kg',
}
export const wasser: TreePath = {
  group: 'wasser',
  category: 'stilles-wasser',
  foodType: 'mineralwasser',
  product: 'wasser-1-5l',
}

interface UnitOptions {
  path?: TreePath
  bestBefore?: string | null
  kcal?: number
  estimated?: boolean
  content?: ContentQuantity
  status?: NodeUnit['status']
  waterMl?: number
  checkedAt?: string
}

let counter = 0
// Nudeln 500 g mit 359 kcal je 100 g: 1.795 kcal, 65 g Eiweiß, 355 g Kohlenhydrate, 7,5 g Fett
export function nodeUnit({
  path = spaghetti,
  bestBefore = '2028-03-31',
  content = { value: 500, unit: 'g' },
  estimated = false,
  kcal = 1795,
  ...rest
}: UnitOptions = {}): NodeUnit {
  counter += 1
  const base = supplyUnit(`e${String(counter)}`, bestBefore, {
    ...rest,
    kcal,
    isKcalEstimated: estimated,
  })
  return { ...base, path, content, macros: { protein: 65, carbs: 355, fat: 7.5 } }
}
