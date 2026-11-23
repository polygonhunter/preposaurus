// Stand der Foto-Erfassung ↔ Entwurf auf dem NAS (M6-03, #66). Gesichert wird bei jedem
// Schrittwechsel, fortgesetzt nach Neuladen oder auf einem anderen Gerät. Offene MHD-Fotos
// (noch nicht entschieden) stehen nicht im Entwurf: Nach dem Fortsetzen zählen nur die Einträge,
// die Fotos bleiben als Bilder erhalten. Ein Datum entsteht auch hier nie neu.
import type { BestBeforePrecision, DateKind } from '@/features/inventory/domain/unit'
import { parseCalendarDay } from '@/shared/lib/dates'
import {
  formatGermanNumber,
  formatQuantity,
  parseContentQuantity,
  parseGermanNumber,
} from '@/shared/lib/quantities'
import type { ContainerChoice } from '../domain/capture-options'
import type { CaptureDraftData } from '../schemas/draft'
import {
  CAPTURE_STEPS,
  initialPhotoCapture,
  type CapturedPhoto,
  type NutritionSource,
  type PhotoCaptureState,
  type PhotoDateEntry,
} from './photo-capture-state'

type DraftNutrition = NonNullable<CaptureDraftData['naehrwerte']>
type DraftPackaging = NonNullable<CaptureDraftData['verpackung']>
type DraftDate = NonNullable<CaptureDraftData['mhd']>[number]

const MAX_AMOUNT = 1_000_000
const SOURCE_TO_DRAFT = {
  label: 'tabelle',
  manual: 'manuell',
  'ai-estimate': 'ki_schaetzung',
} as const
const SOURCE_FROM_DRAFT = {
  tabelle: 'label',
  manuell: 'manual',
  ki_schaetzung: 'ai-estimate',
} as const
const PRECISION_TO_DRAFT = { day: 'tag', month: 'monat', year: 'jahr' } as const
const PRECISION_FROM_DRAFT = { tag: 'day', monat: 'month', jahr: 'year' } as const

function amountOf(text: string): number | null {
  const value = parseGermanNumber(text.replace(/\s*g$/i, ''))
  return value !== null && value >= 0 && value <= MAX_AMOUNT ? value : null
}

const textOf = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : formatGermanNumber(value)

function packagingOf(state: PhotoCaptureState, containers: readonly ContainerChoice[]) {
  const content = parseContentQuantity(state.content)
  const container = containers.find((choice) => choice.id === state.containerId)
  return {
    bezeichnung: state.name.trim() === '' ? null : state.name.trim().slice(0, 120),
    lebensmittelartId: state.foodTypeId,
    behaelter: (container?.key ?? null) as NonNullable<CaptureDraftData['verpackung']>['behaelter'],
    inhaltWert: content.ok && content.value.value <= MAX_AMOUNT ? content.value.value : null,
    inhaltEinheit: content.ok ? content.value.unit : null,
    abtropfgewichtG: amountOf(state.drainedWeight),
  }
}

function nutritionOf(state: PhotoCaptureState): DraftNutrition {
  const { kcal, protein, carbs, fat } = state.nutrition
  return {
    kcal: amountOf(kcal),
    eiweissG: amountOf(protein),
    kohlenhydrateG: amountOf(carbs),
    fettG: amountOf(fat),
    geschaetzt: state.nutritionSource === 'ai-estimate',
    quelle: state.nutritionSource === null ? null : SOURCE_TO_DRAFT[state.nutritionSource],
    bestaetigt: state.isEstimateConfirmed,
    keineTabelle: state.hasNoTable,
    jePortion: state.isPerPortion,
  }
}

function dateOf(entry: PhotoDateEntry): DraftDate {
  const { bestBefore } = entry
  return {
    datum: bestBefore?.date ?? null,
    genauigkeit: bestBefore === null ? null : PRECISION_TO_DRAFT[bestBefore.precision],
    art: entry.kind === 'use-by' ? 'verbrauchen_bis' : 'mhd',
    anzahl: entry.count,
    ohneDatum: bestBefore === null,
    geschaetzt: bestBefore?.isEstimated ?? false,
  }
}

export function toDraftData(
  state: PhotoCaptureState,
  containers: readonly ContainerChoice[],
): CaptureDraftData {
  return {
    schritt: state.isCameraOpen ? state.step : 'zusammenfassung',
    weg: 'foto',
    verpackung: packagingOf(state, containers),
    naehrwerte: nutritionOf(state),
    mhd: state.units.map(dateOf),
    lagerortId: state.storageLocationId,
  }
}

function entryOf(date: DraftDate): PhotoDateEntry | null {
  const kind: DateKind = date.art === 'verbrauchen_bis' ? 'use-by' : 'best-before'
  if (date.datum === null) return { bestBefore: null, count: date.anzahl, kind }
  const day = parseCalendarDay(date.datum)
  if (day === null) return null
  const precision: BestBeforePrecision = PRECISION_FROM_DRAFT[date.genauigkeit ?? 'tag']
  const bestBefore = { date: day, precision, isEstimated: date.geschaetzt === true }
  return { bestBefore, count: date.anzahl, kind }
}

function contentText({ inhaltWert: value, inhaltEinheit: unit }: DraftPackaging): string {
  return value === null || value === undefined || !unit ? '' : formatQuantity({ value, unit })
}

function restorePackaging(packaging: DraftPackaging, containers: readonly ContainerChoice[]) {
  return {
    foodTypeId: packaging.lebensmittelartId ?? null,
    containerId: containers.find((choice) => choice.key === packaging.behaelter)?.id ?? null,
    content: contentText(packaging),
    name: packaging.bezeichnung ?? '',
    drainedWeight: textOf(packaging.abtropfgewichtG),
  }
}

function restoreNutrition(nutrition: DraftNutrition) {
  const { quelle } = nutrition
  const source: NutritionSource | null =
    quelle === null || quelle === undefined ? null : SOURCE_FROM_DRAFT[quelle]
  return {
    nutrition: {
      kcal: textOf(nutrition.kcal),
      protein: textOf(nutrition.eiweissG),
      carbs: textOf(nutrition.kohlenhydrateG),
      fat: textOf(nutrition.fettG),
    },
    nutritionSource: source,
    isEstimateConfirmed: nutrition.bestaetigt === true,
    hasNoTable: nutrition.keineTabelle === true,
    isPerPortion: nutrition.jePortion === true,
  }
}

interface RestoreInput {
  draftId: string
  data: CaptureDraftData
  photos: readonly { id: string; role: CapturedPhoto['role'] }[]
  containers: readonly ContainerChoice[]
  /** Satz, warum die Erkennung aus ist, sonst null (#210) */
  recognitionOff: string | null
}

const restoredPhoto = ({ id, role }: RestoreInput['photos'][number]): CapturedPhoto => ({
  localId: id,
  role,
  status: 'uploaded',
  photoId: id,
  previewUrl: `/api/photos/${id}?variante=vorschau`,
  message: null,
})

/**
 * Wie die Erkennung nach dem Fortsetzen dasteht: Ist sie aus, gab es nie einen Vorschlag, dann
 * steht derselbe Satz wie vorher statt „Vorschlag der Erkennung“ (#210).
 */
const restoredReading = (recognitionOff: string | null) =>
  recognitionOff === null
    ? ({ state: 'done', message: null } as const)
    : ({ state: 'unavailable', message: recognitionOff } as const)

/** Fortsetzen: Schritt Prüfen mit dem gesicherten Stand. Erkannt wird nichts erneut. */
export function fromDraft(input: RestoreInput): PhotoCaptureState {
  const { draftId, data, photos, containers } = input
  const base = initialPhotoCapture(data.lagerortId ?? null)
  const step = CAPTURE_STEPS.find((candidate) => candidate === data.schritt) ?? 'mhd'
  const done = restoredReading(input.recognitionOff)
  const hasPhoto = (role: CapturedPhoto['role']) => photos.some((photo) => photo.role === role)
  return {
    ...base,
    ...restoreNutrition(data.naehrwerte ?? {}),
    ...restorePackaging(data.verpackung ?? {}, containers),
    draftId,
    isCameraOpen: false,
    step,
    units: (data.mhd ?? []).flatMap((date) => entryOf(date) ?? []),
    photos: photos.map(restoredPhoto),
    readings: {
      verpackung: hasPhoto('verpackung') ? done : base.readings.verpackung,
      naehrwerte: hasPhoto('naehrwerte') ? done : base.readings.naehrwerte,
    },
  }
}
