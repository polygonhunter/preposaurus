import type { Quantity } from '@/shared/lib/quantities'

// Eine Packung über 25 kg bzw. 25 l oder unter 1 g bzw. 1 ml ist fast immer ein Lesefehler,
// etwa englisch formatiertes „1.500 l“, das deutsch gelesen 1.500.000 ml ergibt.

/** Größte plausible Packung in g bzw. ml. */
const MAX_PACKAGE_AMOUNT = 25_000
/** Kleinste plausible Packung in g bzw. ml. */
const MIN_PACKAGE_AMOUNT = 1

export type QuantityAssessment =
  { status: 'ok' } | { status: 'review'; reason: 'too-large' | 'too-small' }

/** Inhalt einer Packung prüfen. Stückzahlen haben keine Grenze. */
export function assessPackageQuantity(quantity: Quantity): QuantityAssessment {
  if (quantity.unit === 'piece') return { status: 'ok' }
  if (quantity.value > MAX_PACKAGE_AMOUNT) return { status: 'review', reason: 'too-large' }
  if (quantity.value < MIN_PACKAGE_AMOUNT) return { status: 'review', reason: 'too-small' }
  return { status: 'ok' }
}
