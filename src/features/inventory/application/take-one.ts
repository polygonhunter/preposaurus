// Use-Case „−1“ in der Vorratszeile (#46, UX-Konzept §8.3): nimmt von einer Lebensmittelart
// (bzw. einem Produkt ohne Art) die Packung mit dem frühesten MHD (`pickFifoUnit`, ohne Datum
// zuletzt). Tippen zwei Geräte gleichzeitig, greift das bedingte Update nur einmal je Packung.
// Wer verliert, nimmt die nächste Packung, solange noch eine da ist.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { pickFifoUnit } from '../domain/fifo'
import type { BestBefore } from '../domain/unit'
import type { StockTarget } from '../schemas'
import type { NotFound } from './read-context'
import type { StockReader } from './stock-reader'
import { productFilterFor } from './stock-model'
import type { UnitWriter } from './unit-writer'

// Mehr gleichzeitige Entnahmen derselben Art sind im Haushalt nicht zu erwarten
const MAX_ATTEMPTS = 3

export type TakeOneError = NotFound | { kind: 'empty' }

export interface TakenUnit {
  unitId: string
  bestBefore: BestBefore | null
}

interface TakeOneInput {
  householdId: string
  userId: string
  target: StockTarget
  now: Date
}

interface Ports {
  reader: StockReader
  writer: UnitWriter
}

async function loadStock(reader: StockReader, householdId: string, target: StockTarget) {
  const products = await reader.loadProducts(householdId, productFilterFor(target))
  if (products.length === 0) return null
  const productIds = products.map((product) => product.id)
  return reader.loadUnits(householdId, { productIds, statuses: ['stock'] })
}

export async function takeOne(
  { reader, writer }: Ports,
  { householdId, userId, target, now }: TakeOneInput,
): Promise<Result<TakenUnit, TakeOneError>> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const stock = await loadStock(reader, householdId, target)
    if (stock === null) return err({ kind: 'not-found' })
    const unit = pickFifoUnit(stock)
    if (unit === null) return err({ kind: 'empty' })
    const change = { unitId: unit.id, status: 'consumed' as const, userId, at: now }
    const outcome = await writer.takeOut(householdId, change)
    if (outcome === 'updated') return ok({ unitId: unit.id, bestBefore: unit.bestBefore })
  }
  return err({ kind: 'empty' })
}
