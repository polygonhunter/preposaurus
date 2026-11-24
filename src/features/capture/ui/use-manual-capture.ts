// Zustand und Speichern des manuellen Formulars (#52, #54). Geprüft wird auf dem Gerät mit
// manualCaptureSchema, das die Eingabe von createStockAction liefert und mit createStockSchema
// prüft. Der Server prüft dieselbe Eingabe noch einmal. Die captureId bleibt, bis „Noch eins“
// ein neues Formular beginnt: Ein doppeltes Tippen speichert also nur einmal.
import { useActionState, useState, startTransition } from 'react'
import { createStockAction, type CreateStockState } from '../actions/create-stock-action'
import type { CaptureOptions } from '../domain/capture-options'
import type { CapturePrefill } from '../domain/capture-prefill'
import { manualCaptureSchema } from '../schemas/manual-capture'
import {
  captureErrorsOf,
  clearErrorsFor,
  draftForSaving,
  emptyDraft,
  firstInvalidField,
  isDraftChanged,
  type CaptureErrors,
  type CaptureField,
  type ManualCaptureDraft,
} from './manual-capture-draft'
import { fieldsOfProduct, useRestock } from './use-product-matches'

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
    saved: isSaved ? result : null,
  }
}

type CaptureSetup = Pick<CaptureOptions, 'knownProducts' | 'lastStorageLocationId'> & {
  /** Art bzw. Produkt aus der Adresse (#195), sonst null */
  prefill: CapturePrefill | null
}

/** Erstes Formular: leer oder vorbelegt mit Art bzw. Produkt aus der Adresse (#195). */
function initialDraft({ lastStorageLocationId, prefill }: CaptureSetup): ManualCaptureDraft {
  const draft = emptyDraft(lastStorageLocationId)
  if (prefill === null) return draft
  const product = prefill.product === null ? {} : fieldsOfProduct(prefill.product)
  return { ...draft, foodTypeId: prefill.foodTypeId, ...product }
}

/** Formular samt Stand beim Öffnen bzw. bei „Noch eins“: Daran misst „Abbrechen“ Eingaben (#285). */
function useDraft(setup: CaptureSetup) {
  const [initial, setInitial] = useState(() => initialDraft(setup))
  const [draft, setDraft] = useState(initial)
  function startFresh(storageLocationId: string | null) {
    const fresh = emptyDraft(storageLocationId)
    setInitial(fresh)
    setDraft(fresh)
  }
  return { draft, setDraft, startFresh, isChanged: isDraftChanged(initial, draft) }
}

export function useManualCapture(setup: CaptureSetup, onInvalid: InvalidHandler) {
  const { draft, setDraft, startFresh, isChanged } = useDraft(setup)
  const saving = useSaveCapture(onInvalid)

  function show(next: ManualCaptureDraft, changed: readonly string[]) {
    setDraft(next)
    saving.setErrors((previous) => clearErrorsFor(previous, changed))
    return next
  }

  const restock = useRestock<ManualCaptureDraft>(setup.knownProducts, (fields, update) =>
    show({ ...fields, ...update }, ['content']),
  )

  function change(update: DraftChange) {
    // Ändert sich, was ein Produkt ausmacht, gilt die Wahl eines vorhandenen nicht mehr.
    const reset = touchesMatch(update) ? { existingProductId: null } : {}
    return show({ ...draft, ...update, ...reset }, Object.keys(update))
  }

  function restart() {
    startFresh(draft.storageLocationId)
    saving.setErrors({})
    restock.resetDeclined()
  }

  return {
    draft,
    ...outcomeOf(saving, draft.captureId),
    matches: restock.matchesFor(draft),
    isSaving: saving.isSaving,
    /** Eingaben seit dem Öffnen bzw. „Noch eins“, die beim Verlassen verloren gingen (#285) */
    isChanged,
    change,
    /** Art gewählt: true, wenn dabei ein vorhandenes Produkt vorgewählt wurde */
    selectFoodType: (foodTypeId: string | null) => restock.pickSoleMatch(change({ foodTypeId })),
    selectContainer: (containerId: string | null) => restock.pickSoleMatch(change({ containerId })),
    /** Mit dem Wert aus dem Feld, falls das Verlassen vor dem neuen Zeichnen kommt */
    leaveContent: (content: string) => restock.pickSoleMatch({ ...draft, content }),
    chooseProduct: (productId: string | null) => {
      restock.chooseProduct(draft, productId)
    },
    submit: () => {
      saving.submit(draft)
    },
    restart,
  }
}
