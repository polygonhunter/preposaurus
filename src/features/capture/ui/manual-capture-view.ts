// Was das Formular aus dem Entwurf ableitet: gewählte Art, Einheit für die Nährwerte, gewähltes
// vorhandenes Produkt und die Zusammenfassung (#54). Rein, damit es ohne Browser testbar ist.
import { parseContentQuantity, parseGermanNumber, type ContentUnit } from '@/shared/lib/quantities'
import type { CaptureOptions, FoodTypeChoice } from '../domain/capture-options'
import { summarizeCapture, type CaptureSummary, type KcalBasis } from '../domain/capture-summary'
import type { ManualCaptureDraft } from './manual-capture-draft'
import type { ProductMatch } from './use-product-matches'

export interface ManualCaptureView {
  foodType: FoodTypeChoice | null
  contentUnit: ContentUnit
  chosenMatch: ProductMatch | null
  /** Name in Zusammenfassung und Bestätigung: vorhandenes Produkt oder Lebensmittelart */
  productName: string
  summary: CaptureSummary | null
  storageLocationName: string | null
}

/** Eigene kcal gehen vor, sonst der Richtwert der Art als „ca.“. Beim Nachschub zählt das Produkt. */
function kcalBasisOf(draft: ManualCaptureDraft, foodType: FoodTypeChoice): KcalBasis | null {
  if (draft.existingProductId !== null) return null
  const own = parseGermanNumber(draft.nutrition.kcal)
  if (own !== null && own >= 0) return { per100: own, isEstimate: false }
  return foodType.kcalPer100 === null ? null : { per100: foodType.kcalPer100, isEstimate: true }
}

function storageLocationNameOf(options: CaptureOptions, draft: ManualCaptureDraft): string | null {
  if (draft.existingProductId !== null) return null
  return (
    options.storageLocations.find((location) => location.id === draft.storageLocationId)?.name ??
    null
  )
}

interface SummaryParts {
  draft: ManualCaptureDraft
  foodType: FoodTypeChoice | null
  productName: string
}

/** Zusammenfassung erst, wenn Art und mindestens ein Datum (oder „Datum fehlt“) da sind. */
function summaryOf({ draft, foodType, productName }: SummaryParts): CaptureSummary | null {
  if (foodType === null || draft.units.length === 0) return null
  const content = parseContentQuantity(draft.content)
  return summarizeCapture({
    productName,
    content: content.ok ? content.value : null,
    kcal: kcalBasisOf(draft, foodType),
    entries: draft.units,
  })
}

export function deriveView(
  options: CaptureOptions,
  draft: ManualCaptureDraft,
  matches: readonly ProductMatch[],
): ManualCaptureView {
  const foodType = options.foodTypes.find((choice) => choice.id === draft.foodTypeId) ?? null
  const content = parseContentQuantity(draft.content)
  const chosenMatch = matches.find((match) => match.id === draft.existingProductId) ?? null
  const productName = chosenMatch?.name ?? foodType?.name ?? ''
  return {
    foodType,
    contentUnit: content.ok ? content.value.unit : 'g',
    chosenMatch,
    productName,
    summary: summaryOf({ draft, foodType, productName }),
    storageLocationName: storageLocationNameOf(options, draft),
  }
}
