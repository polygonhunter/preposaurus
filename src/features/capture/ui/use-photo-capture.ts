// Ablauf der Foto-Erfassung (#61 bis #66): Zustand, Fotos samt Upload und Erkennung, Entwurf auf
// dem NAS, Schätzung auf Wahl und Wiedererkennen. Die Komponenten bekommen nur den `PhotoEditor`.
import { useReducer } from 'react'
import type { CaptureOptions } from '../domain/capture-options'
import { photoCaptureReducer } from './photo-capture-reducer'
import type { PhotoCaptureState } from './photo-capture-state'
import { createPhotoEditor, type EditUpdate } from './photo-editor'
import { usePhotoDraftSync } from './use-photo-draft-sync'
import { usePhotoEstimate } from './use-photo-estimate'
import { usePhotoUploads } from './use-photo-uploads'
import { useProductMatches } from './use-product-matches'

export type { PhotoEditor } from './photo-editor'

/** Ändert sich, was ein Produkt ausmacht, gilt ein gewähltes vorhandenes Produkt nicht mehr. */
const MATCH_FIELDS = ['foodTypeId', 'content', 'containerId'] as const

interface PhotoCaptureSetup {
  options: CaptureOptions
  initial: PhotoCaptureState
  isActive: boolean
}

export function usePhotoCapture({ options, initial, isActive }: PhotoCaptureSetup) {
  const [state, dispatch] = useReducer(photoCaptureReducer, initial)
  const lookup = { foodTypes: options.foodTypes, containers: options.containers }
  const uploads = usePhotoUploads({ dispatch, lookup, draftId: state.draftId })
  const estimates = usePhotoEstimate(state, dispatch)
  const { matches, lookUpMatches, clearMatches } = useProductMatches()
  usePhotoDraftSync({ state, containers: options.containers, isActive })

  function edit(update: EditUpdate) {
    const touchesMatch = MATCH_FIELDS.some((field) => field in update)
    const next = touchesMatch ? { ...update, existingProductId: null } : update
    dispatch({ type: 'edit', update: next })
    if (touchesMatch) clearMatches()
    if ('foodTypeId' in update || 'containerId' in update) void lookUpMatches({ ...state, ...next })
  }

  const editor = createPhotoEditor({
    state,
    dispatch,
    edit,
    lookUpMatches: () => void lookUpMatches(state),
    uploads,
    estimate: estimates.estimate,
  })
  return { state, editor, matches, estimates }
}
