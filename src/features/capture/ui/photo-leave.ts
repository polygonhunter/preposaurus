// Was beim Verlassen der Foto-Erfassung verloren ginge (#285). Mit Entwurf liegt alles auf dem NAS,
// ohne Entwurf (noch kein Foto oben) nur auf dem Gerät.
import type { ContainerChoice } from '../domain/capture-options'
import type { PhotoCaptureState } from './photo-capture-state'
import { toDraftData } from './photo-draft-data'

type LeaveKind = 'none' | 'unsaved' | 'draft'

/** Angaben wie im Entwurf, ohne den Schritt der Kamera: Blättern allein ist keine Eingabe. */
function comparableInput(state: PhotoCaptureState, containers: readonly ContainerChoice[]) {
  return JSON.stringify({ ...toDraftData(state, containers), schritt: null })
}

export function photoLeaveKind(
  initial: PhotoCaptureState,
  state: PhotoCaptureState,
  containers: readonly ContainerChoice[],
): LeaveKind {
  if (state.draftId !== null) return 'draft'
  if (state.photos.length > 0 || state.shots.length > 0) return 'unsaved'
  return comparableInput(initial, containers) === comparableInput(state, containers)
    ? 'none'
    : 'unsaved'
}
