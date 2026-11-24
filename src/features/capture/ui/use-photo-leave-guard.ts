// „Abbrechen“ in der Foto-Erfassung (#285): Mit Entwurf fragt das Blatt „Für später behalten“ oder
// „Verwerfen“. Behalten sichert den Stand sofort, sonst ginge eine Änderung der letzten 0,8 s
// (use-photo-draft-sync) verloren. Ohne Entwurf zählen Fotos und Eingaben wie im Formular.
import { discardDraftAction } from '../actions/discard-draft-action'
import { saveDraftAction } from '../actions/save-draft-action'
import type { ContainerChoice } from '../domain/capture-options'
import { NO_LEAVE_GUARD, useLeaveGuard, type LeaveGuard } from './capture-leave'
import type { PhotoCaptureState } from './photo-capture-state'
import { toDraftData } from './photo-draft-data'
import { photoLeaveKind } from './photo-leave'

interface PhotoLeaveSetup {
  initial: PhotoCaptureState
  state: PhotoCaptureState
  containers: readonly ContainerChoice[]
  isSaved: boolean
}

const UNSAVED: LeaveGuard = { kind: 'unsaved' }

function draftGuard(draftId: string, daten: unknown): LeaveGuard {
  return {
    kind: 'draft',
    keep: async () => {
      const result = await saveDraftAction({ entwurfId: draftId, daten })
      return result.ok ? null : result.message
    },
    // Scheitert das Verwerfen (Entwurf schon weg, Sitzung abgelaufen, keine Verbindung), geht es trotzdem hinaus:
    // Ein übrig gebliebener Entwurf kommt beim nächsten Erfassen als Frage, sonst räumt ihn der Job weg.
    discard: async () => {
      await discardDraftAction({ entwurfId: draftId }).catch(() => null)
      return null
    },
  }
}

function guardOf({ initial, state, containers, isSaved }: PhotoLeaveSetup): LeaveGuard {
  if (isSaved) return NO_LEAVE_GUARD
  const kind = photoLeaveKind(initial, state, containers)
  if (kind === 'none') return NO_LEAVE_GUARD
  if (kind === 'unsaved' || state.draftId === null) return UNSAVED
  return draftGuard(state.draftId, toDraftData(state, containers))
}

export function usePhotoLeaveGuard(setup: PhotoLeaveSetup): void {
  useLeaveGuard(guardOf(setup))
}
