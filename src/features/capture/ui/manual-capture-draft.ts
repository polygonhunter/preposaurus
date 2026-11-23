// Zustand des manuellen Formulars (#52) und seine Fehler je Feld. Die Prüfung selbst steht in
// capture/schemas/manual-capture.ts (manualCaptureSchema), hier wird nur übersetzt, wo eine Meldung hingehört.
import type { z } from 'zod'
import { createUuid } from '@/shared/lib/uuid'
import type { DateEntry } from '../domain/date-entries'

export const NUTRITION_FIELDS = ['kcal', 'protein', 'carbs', 'fat'] as const
export type NutritionField = (typeof NUTRITION_FIELDS)[number]

export interface ManualCaptureDraft {
  /** Idempotenz-Schlüssel: einmal je Formular, ein zweites Tippen auf Speichern legt nichts an */
  captureId: string
  foodTypeId: string | null
  content: string
  containerId: string | null
  storageLocationId: string | null
  existingProductId: string | null
  nutrition: Record<NutritionField, string>
  units: DateEntry[]
  /** Foto-Weg: Die Nährwerte sind eine KI-Schätzung, die Zusammenfassung zeigt „ca.“ (#115) */
  isKcalEstimate?: boolean
}

export function emptyDraft(storageLocationId: string | null): ManualCaptureDraft {
  return {
    captureId: createUuid(),
    foodTypeId: null,
    content: '',
    containerId: null,
    storageLocationId,
    existingProductId: null,
    nutrition: { kcal: '', protein: '', carbs: '', fat: '' },
    units: [],
  }
}

/**
 * Was gespeichert wird: Beim Nachschub sind Lagerort und Nährwerte ausgeblendet und gehören zum
 * vorhandenen Produkt. Vorher Eingetipptes darf dann weder speichern noch eine unsichtbare Meldung
 * auslösen. Es bleibt im Entwurf, falls doch „Neu anlegen“ gewählt wird.
 */
export function draftForSaving(draft: ManualCaptureDraft): ManualCaptureDraft {
  if (draft.existingProductId === null) return draft
  return { ...draft, storageLocationId: null, nutrition: emptyDraft(null).nutrition }
}

/** Felder mit eigener Meldung, in der Reihenfolge des Formulars. `form` steht am Knopf. */
const CAPTURE_FIELDS = ['foodTypeId', 'content', 'units', ...NUTRITION_FIELDS] as const
export type CaptureField = (typeof CAPTURE_FIELDS)[number] | 'form'
export type CaptureErrors = Partial<Record<CaptureField, string>>

const isCaptureField = (key: unknown): key is CaptureField =>
  (CAPTURE_FIELDS as readonly unknown[]).includes(key)

function fieldOf(path: readonly PropertyKey[]): CaptureField {
  const [first, second] = path
  const key = first === 'nutrition' ? second : first
  return isCaptureField(key) ? key : 'form'
}

/** Erste Meldung je Feld. Was keinem Feld gehört, steht allgemein am Knopf. */
export function captureErrorsOf(error: z.ZodError): CaptureErrors {
  const errors: CaptureErrors = {}
  for (const issue of error.issues) {
    const field = fieldOf(issue.path)
    errors[field] ??= field === 'form' ? 'Bitte prüfe die Angaben.' : issue.message
  }
  return errors
}

/** Das erste Feld mit Fehler, damit der Fokus dorthin springt. */
export function firstInvalidField(errors: CaptureErrors): CaptureField | null {
  return CAPTURE_FIELDS.find((field) => errors[field] !== undefined) ?? null
}

/** Wer ein Feld ändert, sieht dessen alte Meldung nicht mehr. Neu geprüft wird beim Speichern. */
export function clearErrorsFor(errors: CaptureErrors, changed: readonly string[]): CaptureErrors {
  const cleared: readonly string[] = changed.includes('nutrition')
    ? [...changed, ...NUTRITION_FIELDS]
    : changed
  return Object.fromEntries(Object.entries(errors).filter(([field]) => !cleared.includes(field)))
}
