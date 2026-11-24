// Vorschläge der Erkennung in die Felder übernehmen (#62, #63, #64). Regeln:
// - Nur leere Felder werden gefüllt. Was der Nutzer schon eingetragen hat, bleibt.
// - Was die KI nicht lesen konnte (null), bleibt leer und wird in der Maske gelb markiert.
// - Ein MHD wird nur aus einem gelesenen Datum übernommen, und nur ohne Zweifel. Sonst bleibt das
//   Foto offen, bis jemand entscheidet („bitte prüfen“, „nicht lesbar“). Nie wird eines ergänzt.
import { formatGermanNumber, formatQuantity } from '@/shared/lib/quantities'
import type { CalendarDay } from '@/shared/lib/dates'
import type { CategoryChoice, ContainerChoice, FoodTypeChoice } from '../domain/capture-options'
import { addDateEntry } from '../domain/date-entries'
import type { BestBeforeReading } from '../domain/map-best-before-recognition'
import type { NutritionSuggestion, PackagingSuggestion } from '../domain/map-recognition'
import { assessBestBefore } from '../domain/plausibility'
import { findSimilarFoodType } from '../domain/similar-food-type'
import type { NutritionField } from './manual-capture-draft'
import type {
  DateShot,
  FoodTypeProposal,
  PhotoCaptureState,
  PhotoDateEntry,
} from './photo-capture-state'

export interface SuggestionLookup {
  foodTypes: readonly Pick<FoodTypeChoice, 'id' | 'key' | 'name' | 'searchTerms'>[]
  containers: readonly ContainerChoice[]
  categories: readonly Pick<CategoryChoice, 'id' | 'name'>[]
}

const fillIfEmpty = <T>(current: T | null | '', suggested: T | null) =>
  current === null || current === '' ? suggested : current

type FoodTypeOutcome = Readonly<{ foodTypeId: string | null; proposal: FoodTypeProposal | null }>

/**
 * Art aus der Liste, sonst der Vorschlag einer neuen (#142). Heißt eine sichtbare Art schon so oder
 * trägt sie den Namen als Suchwort, wird sie gewählt (wie ein Treffer der Liste) statt angeboten.
 */
function resolveFoodType(
  packaging: PackagingSuggestion,
  lookup: SuggestionLookup,
): FoodTypeOutcome {
  const listed = lookup.foodTypes.find((foodType) => foodType.key === packaging.foodTypeKey)
  if (listed !== undefined) return { foodTypeId: listed.id, proposal: null }
  const suggested = packaging.newFoodType
  if (suggested === null) return { foodTypeId: null, proposal: null }
  const similar = findSimilarFoodType(lookup.foodTypes, suggested.name)
  if (similar !== null) return { foodTypeId: similar.id, proposal: null }
  const category = lookup.categories.find((entry) => entry.name === suggested.categoryName)
  return {
    foodTypeId: null,
    proposal: {
      name: suggested.name,
      categoryId: category?.id ?? null,
      categoryName: suggested.categoryName,
    },
  }
}

export function applyPackaging(
  state: PhotoCaptureState,
  packaging: PackagingSuggestion,
  lookup: SuggestionLookup,
): PhotoCaptureState {
  const resolved = resolveFoodType(packaging, lookup)
  const foodTypeId = fillIfEmpty(state.foodTypeId, resolved.foodTypeId)
  const containerId =
    lookup.containers.find((container) => container.key === packaging.container)?.id ?? null
  const content = packaging.content === null ? null : formatQuantity(packaging.content)
  const drained =
    packaging.drainedWeightG === null ? null : formatGermanNumber(packaging.drainedWeightG)
  return {
    ...state,
    foodTypeId,
    // Nur ohne gewählte Art: Hat jemand schon gewählt, ist der Vorschlag gegenstandslos.
    foodTypeProposal: foodTypeId === null ? resolved.proposal : null,
    containerId: fillIfEmpty(state.containerId, containerId),
    content: fillIfEmpty(state.content, content) ?? '',
    name: fillIfEmpty(state.name, packaging.name) ?? '',
    drainedWeight: fillIfEmpty(state.drainedWeight, drained) ?? '',
  }
}

const asText = (value: number | null) => (value === null ? '' : formatGermanNumber(value))

function nutritionTexts(values: NutritionSuggestion['values']): Record<NutritionField, string> {
  return {
    kcal: asText(values.kcal),
    protein: asText(values.protein),
    carbs: asText(values.carbs),
    fat: asText(values.fat),
  }
}

const hasOwnNutrition = (state: PhotoCaptureState) =>
  Object.values(state.nutrition).some((text) => text.trim() !== '')

/** Gelesene Tabelle. Eingetippte Werte gehen vor, eine Portion ohne Größe wird nachgefragt. */
export function applyNutrition(
  state: PhotoCaptureState,
  nutrition: NutritionSuggestion,
): PhotoCaptureState {
  if (hasOwnNutrition(state) && state.nutritionSource === 'manual') return state
  return {
    ...state,
    nutrition: nutritionTexts(nutrition.values),
    nutritionSource: 'label',
    isPerPortion: nutrition.isPerPortion,
    hasNoTable: false,
    isEstimateConfirmed: false,
  }
}

/**
 * Schätzung ohne Tabelle (#115): sichtbar „ca.“ und erst nach Bestätigung gültig. Hat jemand
 * inzwischen selbst Werte eingetippt, bleiben sie.
 */
export function applyNutritionEstimate(
  state: PhotoCaptureState,
  values: NutritionSuggestion['values'],
): PhotoCaptureState {
  if (hasOwnNutrition(state) && state.nutritionSource === 'manual') return state
  return {
    ...state,
    nutrition: nutritionTexts(values),
    nutritionSource: 'ai-estimate',
    isEstimateConfirmed: false,
    isPerPortion: false,
  }
}

/** Neues Datum zu den Einträgen, gleiches Datum zählt eine Packung hoch. */
export function addReadDate(
  entries: readonly PhotoDateEntry[],
  reading: Pick<DateShot, 'bestBefore' | 'kind'>,
): PhotoDateEntry[] {
  const merged: PhotoDateEntry[] = addDateEntry(entries, reading.bestBefore)
  return merged.map((entry) =>
    entry.kind === undefined && entry.bestBefore === reading.bestBefore
      ? { ...entry, kind: reading.kind }
      : entry,
  )
}

/** Gelesenes MHD: passt es, wird es ein Eintrag, sonst bleibt das Foto offen. */
export function applyBestBefore(
  state: PhotoCaptureState,
  localId: string,
  { reading, today }: { reading: BestBeforeReading; today: CalendarDay },
): PhotoCaptureState {
  // Schon entschieden oder entfernt: Ein spätes Ergebnis ändert nichts mehr.
  if (!state.shots.some((shot) => shot.localId === localId)) return state
  const kind = reading.kind ?? 'best-before'
  const assessed = assessBestBefore({
    bestBefore: reading.bestBefore,
    confidence: reading.confidence,
    today,
    typicalShelfLifeDays: null,
  })
  const others = state.shots.filter((shot) => shot.localId !== localId)
  if (assessed.status === 'ok') {
    const units = addReadDate(state.units, { bestBefore: assessed.bestBefore, kind })
    return { ...state, units, shots: others }
  }
  const shot: DateShot =
    assessed.status === 'review'
      ? {
          localId,
          issue: 'review',
          bestBefore: assessed.bestBefore,
          kind,
          reasons: assessed.reasons,
        }
      : { localId, issue: 'unreadable', bestBefore: null, kind, reasons: [] }
  return { ...state, shots: state.shots.map((item) => (item.localId === localId ? shot : item)) }
}
