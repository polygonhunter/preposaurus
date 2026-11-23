// Speichern aus dem Schritt Prüfen (#66): erst die Sperren (offene Fotos, unbestätigte Schätzung),
// dann dieselbe Prüfung wie auf dem Server (photoCaptureSchema → createStockSchema). Die
// Entwurfs-ID ist der Idempotenz-Schlüssel, ein doppeltes Tippen speichert einmal. Ohne Entwurf
// (kein Foto ging hoch) legt saveDraftAction erst einen an.
import { startTransition, useActionState, useState } from 'react'
import type { z } from 'zod'
import { createStockAction, type CreateStockState } from '../actions/create-stock-action'
import { saveDraftAction } from '../actions/save-draft-action'
import { photoCaptureSchema } from '../schemas/photo-capture'
import {
  captureErrorsOf,
  firstInvalidField,
  type CaptureErrors,
  type CaptureField,
} from './manual-capture-draft'
import type { PhotoCaptureState } from './photo-capture-state'
import { saveBlocker } from './photo-shots'

type SavePayload = Parameters<typeof createStockAction>[0]

async function save(_previous: CreateStockState | null, payload: SavePayload) {
  return createStockAction(payload)
}

const EXTRA_FIELDS = new Set(['name', 'drainedWeight'])

/** Wie im Formular, dazu Bezeichnung und Abtropfgewicht als Meldung am Knopf. */
function photoErrorsOf(error: z.ZodError): CaptureErrors {
  const errors = captureErrorsOf(error)
  const extra = error.issues.find((issue) => EXTRA_FIELDS.has(String(issue.path[0])))
  return extra === undefined ? errors : { ...errors, form: extra.message }
}

function formOf(state: PhotoCaptureState, draftId: string) {
  return {
    captureId: draftId,
    draftId,
    foodTypeId: state.foodTypeId,
    content: state.content,
    containerId: state.containerId,
    storageLocationId: state.storageLocationId,
    existingProductId: state.existingProductId,
    nutrition: state.nutrition,
    units: state.units,
    name: state.name,
    drainedWeight: state.drainedWeight,
    nutritionSource: state.nutritionSource ?? 'manual',
    isEstimateConfirmed: state.isEstimateConfirmed,
  }
}

async function ensureDraftId(state: PhotoCaptureState): Promise<string | null> {
  if (state.draftId !== null) return state.draftId
  const created = await saveDraftAction({ daten: { weg: 'foto' } })
  return created.ok ? created.draftId : null
}

export function useSavePhotoCapture(onInvalid: (field: CaptureField) => void) {
  const [errors, setErrors] = useState<CaptureErrors>({})
  const [result, dispatch, isSaving] = useActionState(save, null)

  async function submit(state: PhotoCaptureState) {
    const blocker = saveBlocker(state)
    if (blocker !== null) {
      setErrors({ form: blocker })
      return
    }
    const draftId = await ensureDraftId(state)
    if (draftId === null) {
      setErrors({ form: 'Das Speichern hat nicht geklappt. Bitte versuch es noch einmal.' })
      return
    }
    const parsed = photoCaptureSchema.safeParse(formOf(state, draftId))
    if (!parsed.success) {
      const next = photoErrorsOf(parsed.error)
      setErrors(next)
      const field = firstInvalidField(next)
      if (field !== null) onInvalid(field)
      return
    }
    setErrors({})
    startTransition(() => {
      dispatch(parsed.data)
    })
  }

  const serverError = result?.status === 'error' && !isSaving ? result.message : undefined
  const form = errors.form ?? serverError
  return {
    errors: form === undefined ? errors : { ...errors, form },
    saved: result?.status === 'saved' ? result : null,
    isSaving,
    submit,
    clearErrors: () => {
      setErrors({})
    },
  }
}
