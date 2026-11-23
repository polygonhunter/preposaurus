// Speichern einer Erfassung (#51, UX §1 „Zwei Wege, ein Ergebnis“): Foto und manuell liefern
// denselben Entwurf. Hier stehen die Fachregeln, bevor etwas in die DB geht:
// - „Datum fehlt“ ist erlaubt (#116), ein Datum wird nie ergänzt.
// - Eine Schätzung trägt immer das Kennzeichen und ist nie taggenau (#124: Monat oder Jahr).
// - Nur Monat oder Jahr bekannt: Es gilt das Monats- bzw. Jahresende.
// - Nährwerte ohne einen einzigen Wert gelten als „keine eigenen Werte“ (Richtwert beim Lesen, E-5).
import type {
  NutritionValues,
  StoredNutritionSource,
} from '@/features/inventory/domain/nutrition-source'
import type { BestBefore, DateKind } from '@/features/inventory/domain/unit'
import type { ContentQuantity } from '@/shared/lib/quantities'
import { err, ok, type Result } from '@/shared/lib/result'
import { normalizeToPrecision } from './best-before'

export type CaptureMethod = 'photo' | 'manual'

/** Ein Datum (oder „Datum fehlt“) mit der Anzahl Packungen, ein Chip in der Erfassung. */
interface UnitEntry {
  bestBefore: BestBefore | null
  kind: DateKind
  count: number
}

export interface NutritionDraft extends NutritionValues {
  source: StoredNutritionSource
  /** Nur bei einer KI-Schätzung von Bedeutung: gesondert bestätigt (#115) */
  isConfirmed: boolean
}

export interface NewProductDraft {
  foodTypeId: string
  /** Leer: Es gilt der Name der Lebensmittelart */
  name: string | null
  content: ContentQuantity
  drainedWeightG: number | null
  containerId: string | null
  storageLocationId: string | null
  nutrition: NutritionDraft | null
}

/** Neues Produkt oder Nachschub zu einem wiedererkannten (UX §1 „Wiedererkennen“). */
type ProductChoice = { kind: 'existing'; productId: string } | ({ kind: 'new' } & NewProductDraft)

export interface StockDraft {
  /** Idempotenz-Schlüssel, wird zur id der Erfassung */
  captureId: string
  method: CaptureMethod
  /** Entwurf des Foto-Wegs, dessen Fotos beim Speichern zum Produkt gehören (#66), sonst null */
  draftId: string | null
  product: ProductChoice
  units: readonly UnitEntry[]
}

export interface PlannedUnit {
  bestBefore: BestBefore | null
  kind: DateKind
}

export interface PlannedNutrition {
  values: NutritionValues
  source: StoredNutritionSource
  confirmedAt: Date | null
}

export type PlannedProduct =
  | { kind: 'existing'; productId: string }
  | ({ kind: 'new' } & Omit<NewProductDraft, 'nutrition'> & {
        nutrition: PlannedNutrition | null
      })

export interface StockPlan {
  product: PlannedProduct
  units: PlannedUnit[]
}

export interface StockDraftError {
  kind: 'invalid'
  issue: 'estimate-too-precise'
}

function planBestBefore(bestBefore: BestBefore | null): Result<BestBefore | null, StockDraftError> {
  if (bestBefore === null) return ok(null)
  // Eine taggenaue Schätzung täuschte ein gelesenes Datum vor.
  if (bestBefore.isEstimated && bestBefore.precision === 'day') {
    return err({ kind: 'invalid', issue: 'estimate-too-precise' })
  }
  return ok({ ...bestBefore, date: normalizeToPrecision(bestBefore.date, bestBefore.precision) })
}

/** Ein Chip „09/2027 × 6“ wird zu sechs Einheiten mit demselben Datum. */
function expandUnits(entries: readonly UnitEntry[]): Result<PlannedUnit[], StockDraftError> {
  const planned: PlannedUnit[] = []
  for (const entry of entries) {
    const bestBefore = planBestBefore(entry.bestBefore)
    if (!bestBefore.ok) return bestBefore
    for (let index = 0; index < entry.count; index += 1) {
      planned.push({ bestBefore: bestBefore.value, kind: entry.kind })
    }
  }
  return ok(planned)
}

/** Mindestens ein Wert ist da. Ohne einen einzigen gilt der Richtwert (E-5). */
export const hasAnyNutritionValue = ({ kcal, protein, carbs, fat }: NutritionValues) =>
  [kcal, protein, carbs, fat].some((value) => value !== null)

/** Bestätigt wird nur eine KI-Schätzung. Tabelle und eigene Eingabe brauchen das nicht. */
export function planNutrition(draft: NutritionDraft | null, now: Date): PlannedNutrition | null {
  if (draft === null) return null
  const { source, isConfirmed, ...values } = draft
  if (!hasAnyNutritionValue(values)) return null
  const confirmedAt = source === 'ai-estimate' && isConfirmed ? now : null
  return { values, source, confirmedAt }
}

function planProduct(choice: ProductChoice, now: Date): PlannedProduct {
  if (choice.kind === 'existing') return choice
  const name = choice.name?.trim() ?? ''
  return {
    ...choice,
    name: name === '' ? null : name,
    nutrition: planNutrition(choice.nutrition, now),
  }
}

/** Prüft den Entwurf und legt fest, was gespeichert wird. Stammdaten prüft der Use-Case. */
export function planStock(draft: StockDraft, now: Date): Result<StockPlan, StockDraftError> {
  const units = expandUnits(draft.units)
  if (!units.ok) return units
  return ok({ product: planProduct(draft.product, now), units: units.value })
}
