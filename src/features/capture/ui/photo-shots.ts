// Offene MHD-Fotos lösen (#65) und was das Speichern noch sperrt. Ein offenes Foto wird nie still
// gespeichert: Es braucht „Stimmt“, ein eingetipptes Datum, „Datum fehlt“, eine Schätzung auf Wahl
// oder „Entfernen“. Der Speichern-Knopf nennt den Grund, solange etwas fehlt (UX §8.5).
import { addReadDate } from './apply-suggestion'
import type { PhotoCaptureState } from './photo-capture-state'

/** confirm: „bitte prüfen“ bestätigt · missing: „Datum fehlt“ · typed: eingetippt · remove */
export type ShotResolution = 'confirm' | 'missing' | 'typed' | 'remove'

function entriesFor(state: PhotoCaptureState, localId: string, resolution: ShotResolution) {
  const shot = state.shots.find((item) => item.localId === localId)
  if (shot === undefined) return state.units
  if (resolution === 'confirm' && shot.bestBefore !== null) {
    return addReadDate(state.units, { bestBefore: shot.bestBefore, kind: shot.kind })
  }
  if (resolution === 'missing')
    return addReadDate(state.units, { bestBefore: null, kind: shot.kind })
  return state.units
}

export function resolveShot(
  state: PhotoCaptureState,
  localId: string,
  resolution: ShotResolution,
): PhotoCaptureState {
  const units = entriesFor(state, localId, resolution)
  const shots = state.shots.filter((shot) => shot.localId !== localId)
  // Ein nie hochgeladenes Foto verschwindet mit, ein hochgeladenes bleibt als Produktbild.
  const photos =
    resolution === 'remove'
      ? state.photos.filter((photo) => photo.localId !== localId || photo.photoId !== null)
      : state.photos
  return { ...state, units, shots, photos }
}

const SAVE_BLOCKERS: readonly [(state: PhotoCaptureState) => boolean, string][] = [
  [
    (state) => state.photos.some((photo) => photo.status === 'uploading'),
    'Ein Foto lädt noch hoch.',
  ],
  [(state) => state.shots.some((shot) => shot.issue === 'pending'), 'Ein MHD wird noch gelesen.'],
  [(state) => state.shots.length > 0, 'Ein MHD-Foto braucht noch eine Entscheidung.'],
  [
    (state) => state.isPerPortion,
    'Die Nährwerte gelten je Portion. Bitte gebt die Portionsgröße an.',
  ],
  [
    (state) => state.nutritionSource === 'ai-estimate' && !state.isEstimateConfirmed,
    'Bitte bestätigt die geschätzten Nährwerte oder verwerft sie.',
  ],
]

/** Was das Speichern noch sperrt, sonst null. Felder prüft danach das Schema. */
export function saveBlocker(state: PhotoCaptureState): string | null {
  return SAVE_BLOCKERS.find(([isBlocking]) => isBlocking(state))?.[1] ?? null
}
