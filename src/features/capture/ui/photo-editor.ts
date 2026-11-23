// Was die Oberfläche der Foto-Erfassung tun kann, als ein Objekt (#61 bis #66). Die Komponenten
// kennen nur diesen Vertrag, nicht Reducer, Warteschlange oder Actions.
import type { Dispatch } from 'react'
import type { EstimateTarget } from './estimate-target'
import type { PhotoCaptureAction } from './photo-capture-reducer'
import type { CaptureStep, PhotoCaptureState } from './photo-capture-state'
import type { ShotResolution } from './photo-shots'

export type EditUpdate = Extract<PhotoCaptureAction, { type: 'edit' }>['update']

export interface PhotoEditor {
  edit: (update: EditUpdate) => void
  /** Inhalt verlassen: genau ein passendes Produkt vorwählen (#207) */
  leaveContent: () => void
  /** „Zu … hinzufügen“ bzw. „Neu anlegen“ (null) */
  chooseProduct: (productId: string | null) => void
  openCamera: (step: CaptureStep) => void
  closeCamera: () => void
  takePhoto: (file: Blob) => void
  skipTable: () => void
  retryUpload: (localId: string) => void
  /** „Nochmal“ für Verpackung oder Nährwerte, null ohne hochgeladenes Foto */
  readAgainFor: (role: 'verpackung' | 'naehrwerte') => (() => void) | null
  /** „Nochmal lesen“ für ein MHD-Foto, null wenn die Erkennung aus ist (#210) */
  readAgainShot: ((localId: string) => void) | null
  resolveShot: (localId: string, resolution: ShotResolution) => void
  estimate: (target: EstimateTarget, localId?: string | null) => void
  confirmEstimate: () => void
  discardEstimate: () => void
}

export interface EditorParts {
  state: PhotoCaptureState
  dispatch: Dispatch<PhotoCaptureAction>
  edit: (update: EditUpdate) => void
  restock: Pick<PhotoEditor, 'leaveContent' | 'chooseProduct'>
  uploads: {
    takePhoto: (file: Blob, role: CaptureStep) => void
    retryUpload: (localId: string) => void
    readAgain: (localId: string, photoId: string) => void
  }
  /** false, wenn die Erkennung aus ist: Dann gibt es kein „Nochmal“ (#210) */
  canReadAgain: boolean
  estimate: PhotoEditor['estimate']
}

function readAgainFor(
  { state, uploads, canReadAgain }: EditorParts,
  role: 'verpackung' | 'naehrwerte',
) {
  if (!canReadAgain) return null
  const photo = state.photos.findLast((item) => item.role === role && item.photoId !== null)
  const photoId = photo?.photoId ?? null
  if (photo === undefined || photoId === null) return null
  return () => {
    uploads.readAgain(photo.localId, photoId)
  }
}

export function createPhotoEditor(parts: EditorParts): PhotoEditor {
  const { state, dispatch, uploads } = parts
  return {
    edit: parts.edit,
    ...parts.restock,
    openCamera: (step) => {
      dispatch({ type: 'open-camera', step })
    },
    closeCamera: () => {
      dispatch({ type: 'close-camera' })
    },
    takePhoto: (file) => {
      uploads.takePhoto(file, state.step)
    },
    skipTable: () => {
      dispatch({ type: 'skip-table' })
    },
    retryUpload: uploads.retryUpload,
    readAgainFor: (role) => readAgainFor(parts, role),
    readAgainShot: parts.canReadAgain
      ? (localId) => {
          const photoId = state.photos.find((photo) => photo.localId === localId)?.photoId ?? null
          if (photoId !== null) uploads.readAgain(localId, photoId)
        }
      : null,
    resolveShot: (localId, resolution) => {
      dispatch({ type: 'resolve-shot', localId, resolution })
    },
    estimate: parts.estimate,
    confirmEstimate: () => {
      dispatch({ type: 'estimate-confirmed' })
    },
    discardEstimate: () => {
      dispatch({ type: 'estimate-discarded' })
    },
  }
}
