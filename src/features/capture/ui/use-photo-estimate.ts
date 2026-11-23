// Schätzung nur auf ausdrückliche Wahl (#124): „Von der KI schätzen lassen“ beim MHD und bei den
// Nährwerten. Grundlage ist das Verpackungsfoto. Das Ergebnis ist gekennzeichnet („geschätzt“,
// „ca.“), die Nährwerte müssen zusätzlich bestätigt werden (#115).
import { useState, type Dispatch } from 'react'
import { requestEstimateAction } from '../actions/request-estimate-action'
import type { EstimateTarget } from './estimate-target'
import type { PhotoCaptureAction } from './photo-capture-reducer'
import { packagingPhotoOf, type PhotoCaptureState } from './photo-capture-state'

const NEEDS_PACKAGING = 'Für eine Schätzung braucht es zuerst ein Foto der Verpackung.'

interface EstimateNote {
  target: EstimateTarget
  text: string
}

export function usePhotoEstimate(state: PhotoCaptureState, dispatch: Dispatch<PhotoCaptureAction>) {
  const [running, setRunning] = useState<EstimateTarget | null>(null)
  const [note, setNote] = useState<EstimateNote | null>(null)

  async function estimate(target: EstimateTarget, localId: string | null = null) {
    const photoId = packagingPhotoOf(state)?.photoId ?? null
    if (photoId === null) {
      setNote({ target, text: NEEDS_PACKAGING })
      return
    }
    setRunning(target)
    setNote(null)
    const result = await requestEstimateAction({
      fotoId: photoId,
      ziel: target,
      lebensmittelartId: state.foodTypeId,
      bezeichnung: state.name.trim() === '' ? null : state.name.trim(),
    })
    setRunning(null)
    if (!result.ok) {
      setNote({ target, text: result.message })
      return
    }
    if (result.target === 'mhd') {
      dispatch({ type: 'estimated-date', localId, bestBefore: result.bestBefore })
    } else {
      dispatch({ type: 'estimated-nutrition', values: result.nutrition })
    }
  }

  return {
    running,
    noteFor: (target: EstimateTarget) => (note?.target === target ? note.text : null),
    estimate: (target: EstimateTarget, localId?: string | null) => {
      void estimate(target, localId ?? null)
    },
  }
}
