// Übergänge der Foto-Erfassung als reine Funktion (#61 bis #66), damit sie ohne Browser testbar
// sind. Die Kamera geht nach Verpackung und Nährwerten von selbst weiter (UX D10): Die Erkennung
// läuft im Hintergrund, ihre Vorschläge stehen im Schritt Prüfen und sind dort änderbar.
import type { BestBefore } from '@/features/inventory/domain/unit'
import type { NutritionValues } from '@/features/inventory/domain/nutrition-source'
import type { CalendarDay } from '@/shared/lib/dates'
import {
  addReadDate,
  applyBestBefore,
  applyNutrition,
  applyNutritionEstimate,
  applyPackaging,
  type SuggestionLookup,
} from './apply-suggestion'
import type { RecognitionOutcome } from './photo-api'
import {
  nextStep,
  type CapturedPhoto,
  type CaptureStep,
  type DateShot,
  type PhotoCaptureState,
  type UploadStatus,
} from './photo-capture-state'
import { resolveShot, type ShotResolution } from './photo-shots'

type EditableFields = Pick<
  PhotoCaptureState,
  | 'foodTypeId'
  | 'content'
  | 'containerId'
  | 'storageLocationId'
  | 'existingProductId'
  | 'nutrition'
  | 'units'
  | 'name'
  | 'drainedWeight'
  | 'nutritionSource'
  | 'isPerPortion'
>

export interface UploadUpdate {
  status: UploadStatus
  photoId?: string
  draftId?: string
  message?: string
}

export type PhotoCaptureAction =
  | { type: 'edit'; update: Partial<EditableFields> }
  | { type: 'open-camera'; step: CaptureStep }
  | { type: 'close-camera' }
  | { type: 'shot'; photo: CapturedPhoto }
  | { type: 'skip-table' }
  | { type: 'upload'; localId: string; update: UploadUpdate }
  | {
      type: 'recognized'
      localId: string
      outcome: RecognitionOutcome
      context: { lookup: SuggestionLookup; today: CalendarDay }
    }
  | { type: 'resolve-shot'; localId: string; resolution: ShotResolution }
  | { type: 'estimated-date'; localId: string | null; bestBefore: BestBefore }
  | { type: 'estimated-nutrition'; values: NutritionValues }
  | { type: 'estimate-confirmed' }
  | { type: 'estimate-discarded' }
  | { type: 'read-again'; localId: string }

function takeShot(state: PhotoCaptureState, photo: CapturedPhoto): PhotoCaptureState {
  const photos = [...state.photos, photo]
  if (photo.role === 'mhd') {
    const shot: DateShot = {
      localId: photo.localId,
      issue: 'pending',
      bestBefore: null,
      kind: 'best-before',
      reasons: [],
    }
    return { ...state, photos, shots: [...state.shots, shot] }
  }
  const readings = { ...state.readings, [photo.role]: { state: 'reading', message: null } }
  const hasNoTable = photo.role === 'naehrwerte' ? false : state.hasNoTable
  return { ...state, photos, readings, hasNoTable, step: nextStep(photo.role) }
}

/** „Nochmal“: dasselbe Foto wird wieder gelesen. */
function readAgain(state: PhotoCaptureState, localId: string): PhotoCaptureState {
  const role = state.photos.find((photo) => photo.localId === localId)?.role
  if (role === undefined) return state
  if (role === 'mhd') {
    const shots = state.shots.map((shot) =>
      shot.localId === localId ? { ...shot, issue: 'pending' as const } : shot,
    )
    return { ...state, shots }
  }
  return { ...state, readings: { ...state.readings, [role]: { state: 'reading', message: null } } }
}

function updateUpload(state: PhotoCaptureState, localId: string, update: UploadUpdate) {
  const photos = state.photos.map((photo) =>
    photo.localId === localId
      ? {
          ...photo,
          status: update.status,
          photoId: update.photoId ?? photo.photoId,
          message: update.message ?? null,
        }
      : photo,
  )
  return { ...state, photos, draftId: state.draftId ?? update.draftId ?? null }
}

function recognitionFailed(
  state: PhotoCaptureState,
  localId: string,
  outcome: Extract<RecognitionOutcome, { ok: false }>,
): PhotoCaptureState {
  const role = state.photos.find((photo) => photo.localId === localId)?.role
  if (role === 'mhd') {
    const shots = state.shots.map((shot) =>
      shot.localId === localId ? { ...shot, issue: 'not-read' as const } : shot,
    )
    return { ...state, shots }
  }
  if (role === undefined) return state
  const reading = { state: outcome.kind, message: outcome.message }
  return { ...state, readings: { ...state.readings, [role]: reading } }
}

function recognized(
  state: PhotoCaptureState,
  action: Extract<PhotoCaptureAction, { type: 'recognized' }>,
): PhotoCaptureState {
  const { localId, outcome, context } = action
  if (!outcome.ok) return recognitionFailed(state, localId, outcome)
  const done = { state: 'done', message: null } as const
  const { suggestion } = outcome
  switch (suggestion.role) {
    case 'verpackung':
      return {
        ...applyPackaging(state, suggestion.packaging, context.lookup),
        readings: { ...state.readings, verpackung: done },
      }
    case 'naehrwerte':
      return {
        ...applyNutrition(state, suggestion.nutrition),
        readings: { ...state.readings, naehrwerte: done },
      }
    case 'mhd':
      return applyBestBefore(state, localId, {
        reading: suggestion.bestBefore,
        today: context.today,
      })
  }
}

/**
 * Schätzung für ein offenes MHD-Foto. Ist es inzwischen anders entschieden („Datum fehlt“,
 * Entfernen, doppelt getippt), kommt keine weitere Packung mit geschätztem Datum dazu.
 */
function addEstimatedDate(
  state: PhotoCaptureState,
  localId: string | null,
  bestBefore: BestBefore,
) {
  if (localId !== null && !state.shots.some((shot) => shot.localId === localId)) return state
  const shots = state.shots.filter((shot) => shot.localId !== localId)
  return { ...state, shots, units: addReadDate(state.units, { bestBefore, kind: 'best-before' }) }
}

const withoutEstimate = (state: PhotoCaptureState): PhotoCaptureState => ({
  ...state,
  nutrition: { kcal: '', protein: '', carbs: '', fat: '' },
  nutritionSource: null,
  isEstimateConfirmed: false,
})

type Handlers = {
  [K in PhotoCaptureAction['type']]: (
    state: PhotoCaptureState,
    action: Extract<PhotoCaptureAction, { type: K }>,
  ) => PhotoCaptureState
}

/** Je Aktion genau ein Übergang. Fehlt einer, bricht schon tsc ab. */
const HANDLERS: Handlers = {
  edit: (state, { update }) => ({ ...state, ...update }),
  'open-camera': (state, { step }) => ({ ...state, isCameraOpen: true, step }),
  'close-camera': (state) => ({ ...state, isCameraOpen: false }),
  shot: (state, { photo }) => takeShot(state, photo),
  'skip-table': (state) => ({ ...state, hasNoTable: true, step: 'mhd' }),
  upload: (state, { localId, update }) => updateUpload(state, localId, update),
  recognized,
  'resolve-shot': (state, { localId, resolution }) => resolveShot(state, localId, resolution),
  'estimated-date': (state, { localId, bestBefore }) =>
    addEstimatedDate(state, localId, bestBefore),
  'estimated-nutrition': (state, { values }) => applyNutritionEstimate(state, values),
  'estimate-confirmed': (state) => ({ ...state, isEstimateConfirmed: true }),
  'estimate-discarded': withoutEstimate,
  'read-again': (state, { localId }) => readAgain(state, localId),
}

export function photoCaptureReducer(
  state: PhotoCaptureState,
  action: PhotoCaptureAction,
): PhotoCaptureState {
  const handle = HANDLERS[action.type] as (
    current: PhotoCaptureState,
    next: PhotoCaptureAction,
  ) => PhotoCaptureState
  return handle(state, action)
}
