// Entwurf auf dem NAS mitführen (M6-03): Ändert sich der Stand, wird er kurz danach gesichert.
// So geht nach Neuladen oder auf einem anderen Gerät nichts verloren. Ohne Entwurf (noch kein
// Foto hochgeladen) wird nichts gesichert, ebenso nicht mehr nach Speichern oder Verwerfen.
import { useEffect } from 'react'
import { saveDraftAction } from '../actions/save-draft-action'
import type { ContainerChoice } from '../domain/capture-options'
import type { PhotoCaptureState } from './photo-capture-state'
import { toDraftData } from './photo-draft-data'

const SAVE_DELAY_MS = 800

interface DraftSync {
  state: PhotoCaptureState
  containers: readonly ContainerChoice[]
  /** false nach Speichern oder Verwerfen */
  isActive: boolean
}

export function usePhotoDraftSync({ state, containers, isActive }: DraftSync) {
  const { draftId } = state
  const payload = JSON.stringify(toDraftData(state, containers))

  useEffect(() => {
    if (!isActive || draftId === null) return
    const timer = setTimeout(() => {
      void saveDraftAction({ entwurfId: draftId, daten: JSON.parse(payload) as unknown })
    }, SAVE_DELAY_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [draftId, payload, isActive])
}
