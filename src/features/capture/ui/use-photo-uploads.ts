// Fotos im Hintergrund hochladen und erkennen (#61): Der Auslöser ist sofort wieder bereit, die
// Warteschlange lädt höchstens zwei Fotos gleichzeitig und wiederholt bei Netzfehlern. Scheitert
// es endgültig, bleibt das Foto im Gerät und lässt sich neu senden. Nach dem Upload folgt die
// Erkennung. Ist die KI aus (503), fragt die Maske danach nicht mehr und geht von Hand weiter.
import { useRef, type Dispatch } from 'react'
import type { PhotoRole } from '@/shared/config/constants'
import { todayInBerlin } from '@/shared/lib/dates'
import { createRetryQueue, type QueueUpdate } from '@/shared/lib/retry-queue'
import { createUuid } from '@/shared/lib/uuid'
import type { SuggestionLookup } from './apply-suggestion'
import {
  recognizePhoto,
  uploadPhoto,
  type RecognitionOutcome,
  type UploadOutcome,
} from './photo-api'
import type { PhotoCaptureAction, UploadUpdate } from './photo-capture-reducer'
import type { CapturedPhoto } from './photo-capture-state'

const NOT_UPLOADED = 'nicht hochgeladen'

interface UploadDeps {
  dispatch: Dispatch<PhotoCaptureAction>
  lookup: SuggestionLookup
  /** Fortgesetzter Entwurf, sonst null bis zum ersten Upload. „Noch eins“ baut den Ablauf neu auf. */
  draftId: string | null
}

type UploadQueue = ReturnType<typeof createRetryQueue<UploadOutcome>>

/** Zustand des Fotos zu einer Meldung der Warteschlange. */
function uploadUpdateOf({ status, result }: QueueUpdate<UploadOutcome>): UploadUpdate {
  if (status === 'waiting' || status === 'running') return { status: 'uploading' }
  if (status === 'failed' || result === undefined)
    return { status: 'failed', message: NOT_UPLOADED }
  if (!result.ok) return { status: 'rejected', message: result.message }
  return { status: 'uploaded', photoId: result.photoId, draftId: result.draftId }
}

const QUEUE_LIMITS = { concurrency: 2, maxAttempts: 3, retryDelayMs: 1500 }

/** Ist die KI aus, steht der Satz in `unavailable`, und es wird nicht erneut gefragt. */
async function readPhoto(
  photoId: string,
  unavailable: { current: string | null },
): Promise<RecognitionOutcome> {
  if (unavailable.current !== null) {
    return { ok: false, kind: 'unavailable', message: unavailable.current }
  }
  const outcome = await recognizePhoto(photoId)
  if (!outcome.ok && outcome.kind === 'unavailable') unavailable.current = outcome.message
  return outcome
}

/** Foto im Gerät, die Vorschau kommt sofort aus der Datei. */
function newPhoto(file: Blob, role: PhotoRole): CapturedPhoto {
  const previewUrl = URL.createObjectURL(file)
  return {
    localId: createUuid(),
    role,
    status: 'uploading',
    photoId: null,
    previewUrl,
    message: null,
  }
}

export function usePhotoUploads({ dispatch, lookup, draftId }: UploadDeps) {
  const draftIdRef = useRef(draftId)
  const unavailableRef = useRef<string | null>(null)
  const queueRef = useRef<UploadQueue | null>(null)

  async function recognize(localId: string, photoId: string) {
    const outcome = await readPhoto(photoId, unavailableRef)
    const context = { lookup, today: todayInBerlin(new Date()) }
    dispatch({ type: 'recognized', localId, outcome, context })
  }

  function onUpdate(queued: QueueUpdate<UploadOutcome>) {
    const update = uploadUpdateOf(queued)
    if (update.draftId !== undefined) draftIdRef.current ??= update.draftId
    dispatch({ type: 'upload', localId: queued.id, update })
    if (update.photoId !== undefined) void recognize(queued.id, update.photoId)
  }

  /** Erst beim ersten Foto angelegt, nur aus Ereignissen heraus. */
  function queue(): UploadQueue {
    queueRef.current ??= createRetryQueue<UploadOutcome>({ ...QUEUE_LIMITS, onUpdate })
    return queueRef.current
  }

  function takePhoto(file: Blob, role: PhotoRole) {
    const photo = newPhoto(file, role)
    dispatch({ type: 'shot', photo })
    queue().add(photo.localId, () => uploadPhoto(file, role, draftIdRef.current))
  }

  return {
    takePhoto,
    retryUpload: (localId: string) => {
      queue().retry(localId)
    },
    /** „Nochmal“ nach einem Fehlschlag der Erkennung, auch wenn die KI vorher aus war. */
    readAgain: (localId: string, photoId: string) => {
      unavailableRef.current = null
      dispatch({ type: 'read-again', localId })
      void recognize(localId, photoId)
    },
  }
}
