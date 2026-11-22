// Zustand und Speichern des manuellen Formulars (#52, #54). Geprüft wird auf dem Gerät mit
// manualCaptureSchema, das die Eingabe von createStockAction liefert und mit createStockSchema
// prüft. Der Server prüft dieselbe Eingabe noch einmal. Die captureId bleibt, bis „Noch eins“
// ein neues Formular beginnt: Ein doppeltes Tippen speichert also nur einmal.
import { useActionState, useState, startTransition } from 'react'
import { createStockAction, type CreateStockState } from '../actions/create-stock-action'
import { manualCaptureSchema } from '../schemas'
import {
  captureErrorsOf,
  clearErrorsFor,
  draftForSaving,
  emptyDraft,
  firstInvalidField,
  type CaptureErrors,
  type CaptureField,
  type ManualCaptureDraft,
} from './manual-capture-draft'
import { useProductMatches } from './use-product-matches'

type SavePayload = Parameters<typeof createStockAction>[0]

async function save(_previous: CreateStockState | null, payload: SavePayload) {
  return createStockAction(payload)
}

type DraftChange = Partial<Omit<ManualCaptureDraft, 'captureId'>>

/** Diese Felder entscheiden, ob ein vorhandenes Produkt passt. */
const MATCH_FIELDS = ['foodTypeId', 'content', 'containerId'] as const

const touchesMatch = (change: DraftChange) => MATCH_FIELDS.some((field) => field in change)

type InvalidHandler = (field: CaptureField) => void

/** Prüfen auf dem Gerät, dann speichern. Fehler stehen am Feld, der Fokus springt zum ersten. */
function useSaveCapture(onInvalid: InvalidHandler) {
  const [errors, setErrors] = useState<CaptureErrors>({})
  const [result, dispatch, isSaving] = useActionState(save, null)

  function submit(draft: ManualCaptureDraft) {
    const parsed = manualCaptureSchema.safeParse(draftForSaving(draft))
    if (parsed.success) {
      setErrors({})
      startTransition(() => {
        dispatch(parsed.data)
      })
      return
    }
    const nextErrors = captureErrorsOf(parsed.error)
    setErrors(nextErrors)
    const field = firstInvalidField(nextErrors)
    if (field !== null) onInvalid(field)
  }

  return { errors, setErrors, result, isSaving, submit }
}

type SaveState = Pick<ReturnType<typeof useSaveCapture>, 'errors' | 'result' | 'isSaving'>

/** Gilt das Ergebnis diesem Formular? Ein Fehler vom Server steht am Knopf. */
function outcomeOf({ errors, result, isSaving }: SaveState, captureId: string) {
  const isSaved = result?.status === 'saved' && result.captureId === captureId
  const serverError = result?.status === 'error' && !isSaving ? result.message : undefined
  const form = errors.form ?? serverError
  return {
    errors: form === undefined ? errors : { ...errors, form },
    savedUnits: isSaved ? result.unitCount : null,
  }
}

export function useManualCapture(lastStorageLocationId: string | null, onInvalid: InvalidHandler) {
  const [draft, setDraft] = useState(() => emptyDraft(lastStorageLocationId))
  const saving = useSaveCapture(onInvalid)
  const { matches, lookUpMatches, clearMatches } = useProductMatches()

  function change(update: DraftChange) {
    const next = { ...draft, ...update }
    // Ändert sich, was ein Produkt ausmacht, gelten Angebot und Wahl eines vorhandenen nicht mehr.
    if (touchesMatch(update)) {
      next.existingProductId = null
      clearMatches()
    }
    setDraft(next)
    saving.setErrors((previous) => clearErrorsFor(previous, Object.keys(update)))
    return next
  }

  function restart() {
    setDraft(emptyDraft(draft.storageLocationId))
    saving.setErrors({})
    clearMatches()
  }

  return {
    draft,
    ...outcomeOf(saving, draft.captureId),
    matches,
    isSaving: saving.isSaving,
    change,
    lookUpMatches,
    submit: () => {
      saving.submit(draft)
    },
    restart,
  }
}
