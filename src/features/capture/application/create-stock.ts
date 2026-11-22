// Use-Case „Speichern“ (#51, ERF-10, ERF-12): ein Weg für Foto und manuell. In einer Transaktion
// entstehen Erfassung, Produkt (oder Nachschub zu einem bestehenden) und je Packung eine Einheit.
// Die id der Erfassung ist der Idempotenz-Schlüssel: Ein zweiter Aufruf mit derselben id legt
// nichts an und liefert das erste Ergebnis. Stammdaten gelten nur aus dem eigenen Haushalt bzw.
// als System-Einträge, alles andere ist „nicht gefunden“ (#133).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  planStock,
  type PlannedProduct,
  type StockDraft,
  type StockDraftError,
  type StockPlan,
} from '../domain/stock-draft'
import type { NewProductRow, SavedCapture } from '../domain/stock-records'
import type { StockTransaction, StockWriter } from './stock-writer'

type StockReference = 'food-type' | 'storage-location' | 'container' | 'product'

export type CreateStockError =
  | StockDraftError
  | { kind: 'not-found'; reference: StockReference }
  /** Die Erfassungs-ID gehört schon einem anderen Haushalt */
  | { kind: 'conflict' }

export interface CreatedStock extends SavedCapture {
  captureId: string
  /** true, wenn derselbe Schlüssel schon gespeichert war und nichts Neues entstand */
  isReplay: boolean
}

export interface CreateStockDeps {
  writer: StockWriter
  now: () => Date
}

export interface CreateStockRequest {
  householdId: string
  userId: string
  draft: StockDraft
}

type NewProduct = Extract<PlannedProduct, { kind: 'new' }>
type Target = { kind: 'existing'; productId: string } | { kind: 'new'; row: NewProductRow }
type Resolved = Result<Target, CreateStockError>

const notFound = (reference: StockReference) => err({ kind: 'not-found', reference } as const)

async function checkOptionalRefs(
  tx: StockTransaction,
  householdId: string,
  product: NewProduct,
): Promise<StockReference | null> {
  const { containerId, storageLocationId } = product
  if (containerId !== null && !(await tx.hasContainer(containerId))) return 'container'
  if (storageLocationId !== null && !(await tx.hasStorageLocation(householdId, storageLocationId)))
    return 'storage-location'
  return null
}

/** Die Kategorie kommt aus der Lebensmittelart, nie aus der Eingabe (#110). */
async function resolveNewProduct(
  tx: StockTransaction,
  householdId: string,
  product: NewProduct,
): Promise<Resolved> {
  const foodType = await tx.findFoodType(householdId, product.foodTypeId)
  if (foodType === null) return notFound('food-type')
  const missing = await checkOptionalRefs(tx, householdId, product)
  if (missing !== null) return notFound(missing)
  const row: NewProductRow = {
    householdId,
    categoryId: foodType.categoryId,
    foodTypeId: foodType.id,
    name: product.name ?? foodType.name,
    content: product.content,
    drainedWeightG: product.drainedWeightG,
    containerId: product.containerId,
    storageLocationId: product.storageLocationId,
    nutrition: product.nutrition,
  }
  return ok({ kind: 'new', row })
}

async function resolveTarget(
  tx: StockTransaction,
  householdId: string,
  product: PlannedProduct,
): Promise<Resolved> {
  if (product.kind === 'new') return resolveNewProduct(tx, householdId, product)
  if (!(await tx.hasProduct(householdId, product.productId))) return notFound('product')
  return ok(product)
}

async function replay(
  tx: StockTransaction,
  request: CreateStockRequest,
): Promise<Result<CreatedStock, CreateStockError>> {
  const previous = await tx.findCapture(request.householdId, request.draft.captureId)
  if (previous.kind === 'foreign') return err({ kind: 'conflict' })
  // Ohne gespeicherte Einheiten gibt es keine Erfassung: Beides entsteht in einer Transaktion.
  if (previous.kind === 'none') throw new Error('Erfassung nach Konflikt nicht gefunden')
  const { productId, unitCount } = previous
  return ok({ captureId: request.draft.captureId, productId, unitCount, isReplay: true })
}

async function write(
  tx: StockTransaction,
  request: CreateStockRequest,
  plan: StockPlan,
): Promise<Result<CreatedStock, CreateStockError>> {
  const { householdId, userId, draft } = request
  const target = await resolveTarget(tx, householdId, plan.product)
  if (!target.ok) return target
  const capture = { id: draft.captureId, householdId, userId, method: draft.method }
  if (!(await tx.claimCapture(capture))) return replay(tx, request)
  const productId =
    target.value.kind === 'new' ? await tx.insertProduct(target.value.row) : target.value.productId
  await tx.insertUnits({ productId, captureId: capture.id, units: plan.units })
  return ok({ captureId: capture.id, productId, unitCount: plan.units.length, isReplay: false })
}

export async function createStock(
  deps: CreateStockDeps,
  request: CreateStockRequest,
): Promise<Result<CreatedStock, CreateStockError>> {
  const plan = planStock(request.draft, deps.now())
  if (!plan.ok) return plan
  return deps.writer.transaction(async (tx) => {
    const previous = await tx.findCapture(request.householdId, request.draft.captureId)
    if (previous.kind !== 'none') return replay(tx, request)
    return write(tx, request, plan.value)
  })
}
