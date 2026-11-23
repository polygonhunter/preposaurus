// Zustand der Foto-Erfassung (#61 bis #66). Die Felder sind dieselben wie im manuellen Formular
// (ManualCaptureDraft), dazu Fotos, offene MHD-Fotos und der Stand der Erkennung. Alles, was die
// KI liefert, landet nur als Vorschlag in diesen Feldern und bleibt bis zum Speichern änderbar.
import type { BestBefore, DateKind } from '@/features/inventory/domain/unit'
import type { PhotoRole } from '@/shared/config/constants'
import type { DateEntry } from '../domain/date-entries'
import type { ReviewReason } from '../domain/plausibility'
import { emptyDraft, type ManualCaptureDraft } from './manual-capture-draft'

export const CAPTURE_STEPS = ['verpackung', 'naehrwerte', 'mhd'] as const
export type CaptureStep = (typeof CAPTURE_STEPS)[number]

/** Ein Datum mit Anzahl. Ohne `kind` gilt es als MHD (eingetippte Daten). */
export type PhotoDateEntry = DateEntry & { kind?: DateKind }

export type UploadStatus = 'uploading' | 'uploaded' | 'failed' | 'rejected'

export interface CapturedPhoto {
  /** Auf dem Gerät vergeben, bevor der Server eine ID kennt */
  localId: string
  role: PhotoRole
  status: UploadStatus
  photoId: string | null
  /** Vorschau aus dem Gerät (Object-URL) oder vom Server */
  previewUrl: string | null
  message: string | null
}

type ReadingState = 'idle' | 'reading' | 'done' | 'unavailable' | 'failed'

export interface Reading {
  state: ReadingState
  message: string | null
}

/**
 * Ein MHD-Foto, das noch eine Entscheidung braucht: wird gelesen, nicht lesbar, „bitte prüfen“
 * oder nicht gelesen (Erkennung aus oder gescheitert). Gelöst wird es durch Bestätigen, Eintippen,
 * „Datum fehlt“, eine Schätzung auf Wahl oder Entfernen. Nie wird es still gespeichert.
 */
type ShotIssue = 'pending' | 'unreadable' | 'review' | 'not-read'

export interface DateShot {
  localId: string
  issue: ShotIssue
  bestBefore: BestBefore | null
  kind: DateKind
  reasons: ReviewReason[]
}

export type NutritionSource = 'label' | 'manual' | 'ai-estimate'

type FormFields = Omit<ManualCaptureDraft, 'captureId' | 'units'>

export interface PhotoCaptureState extends FormFields {
  draftId: string | null
  isCameraOpen: boolean
  step: CaptureStep
  units: PhotoDateEntry[]
  name: string
  drainedWeight: string
  /** null: keine eigenen Werte, es gilt der Richtwert der Art */
  nutritionSource: NutritionSource | null
  /** „Keine Nährwerttabelle“ gewählt (#115) */
  hasNoTable: boolean
  isEstimateConfirmed: boolean
  /** Tabelle nennt nur Werte je Portion, die Portionsgröße fehlt noch */
  isPerPortion: boolean
  photos: CapturedPhoto[]
  shots: DateShot[]
  readings: Record<'verpackung' | 'naehrwerte', Reading>
}

const IDLE: Reading = { state: 'idle', message: null }

export function initialPhotoCapture(storageLocationId: string | null): PhotoCaptureState {
  const empty = emptyDraft(storageLocationId)
  return {
    foodTypeId: null,
    content: '',
    containerId: null,
    storageLocationId,
    existingProductId: null,
    nutrition: empty.nutrition,
    units: [],
    draftId: null,
    isCameraOpen: true,
    step: 'verpackung',
    name: '',
    drainedWeight: '',
    nutritionSource: null,
    hasNoTable: false,
    isEstimateConfirmed: false,
    isPerPortion: false,
    photos: [],
    shots: [],
    readings: { verpackung: IDLE, naehrwerte: IDLE },
  }
}

/** Der nächste Schritt der Kamera, nach dem MHD bleibt sie beim MHD. */
export function nextStep(step: CaptureStep): CaptureStep {
  return step === 'verpackung' ? 'naehrwerte' : 'mhd'
}

export const packagingPhotoOf = (state: Pick<PhotoCaptureState, 'photos'>) =>
  state.photos.find((photo) => photo.role === 'verpackung' && photo.photoId !== null) ?? null
