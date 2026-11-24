// Ablauf der Foto-Erfassung (#61 bis #66): Zustand, Fotos samt Upload und Erkennung, Entwurf auf
// dem NAS, Schätzung auf Wahl und Wiedererkennen. Die Komponenten bekommen nur den `PhotoEditor`.
import { useReducer } from 'react'
import type { CaptureOptions, FoodTypeChoice } from '../domain/capture-options'
import { photoCaptureReducer } from './photo-capture-reducer'
import type { PhotoCaptureState } from './photo-capture-state'
import { createPhotoEditor, type EditUpdate } from './photo-editor'
import { usePhotoDraftSync } from './use-photo-draft-sync'
import { usePhotoEstimate } from './use-photo-estimate'
import { usePhotoUploads } from './use-photo-uploads'
import { useRestock } from './use-product-matches'

export type { PhotoEditor } from './photo-editor'

/** Diese Felder entscheiden, ob ein vorhandenes Produkt passt. */
const MATCH_FIELDS = ['foodTypeId', 'content', 'containerId'] as const

/** Ändert sich, was ein Produkt ausmacht, gilt ein gewähltes vorhandenes nicht mehr. */
function withMatchReset(update: EditUpdate): EditUpdate {
  const touchesMatch = MATCH_FIELDS.some((field) => field in update)
  return touchesMatch && !('existingProductId' in update)
    ? { ...update, existingProductId: null }
    : update
}

interface PhotoCaptureSetup {
  options: CaptureOptions
  initial: PhotoCaptureState
  isActive: boolean
  /** Satz, warum die Erkennung aus ist: Dann gibt es kein „Nochmal“ (#210) */
  recognitionOff: string | null
  /** Neue Art in die Auswahllisten aufnehmen (#142) */
  onFoodTypeAdded: (foodType: FoodTypeChoice) => void
}

export function usePhotoCapture(setup: PhotoCaptureSetup) {
  const { options, isActive, recognitionOff } = setup
  const [state, dispatch] = useReducer(photoCaptureReducer, setup.initial)
  const { foodTypes, containers, categories } = options
  const lookup = { foodTypes, containers, categories }
  const uploads = usePhotoUploads({ dispatch, lookup, draftId: state.draftId })
  const estimates = usePhotoEstimate(state, dispatch)
  usePhotoDraftSync({ state, containers: options.containers, isActive })

  function editFields(update: EditUpdate) {
    const next = withMatchReset(update)
    dispatch({ type: 'edit', update: next })
    return { ...state, ...next }
  }

  // Wiedererkennen wie im Formular (#207), mit Vorwahl bei genau einem passenden Produkt
  const restock = useRestock<PhotoCaptureState>(options.knownProducts, (_fields, update) => {
    editFields(update)
  })

  function edit(update: EditUpdate) {
    const next = editFields(update)
    if ('foodTypeId' in update || 'containerId' in update) restock.pickSoleMatch(next)
  }

  const editor = createPhotoEditor({
    state,
    dispatch,
    edit,
    addFoodType: setup.onFoodTypeAdded,
    restock: {
      leaveContent: (content) => {
        restock.pickSoleMatch({ ...state, content })
      },
      chooseProduct: (productId) => {
        restock.chooseProduct(state, productId)
      },
    },
    uploads,
    canReadAgain: recognitionOff === null,
    estimate: estimates.estimate,
  })
  return { state, editor, matches: restock.matchesFor(state), estimates }
}
