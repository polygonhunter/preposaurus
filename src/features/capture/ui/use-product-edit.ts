// Zustand und Speichern von „Angaben bearbeiten“ (#49). Geprüft wird auf dem Gerät mit
// productEditFormSchema, der Server prüft dieselbe Eingabe noch einmal (updateProductSchema).
// Nach dem Speichern geht es zur Detailseite der Lebensmittelart.
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateProductAction } from '../actions/update-product-action'
import type { FoodTypeChoice } from '../domain/capture-options'
import { productEditFormSchema } from '../schemas/product-edit'
import {
  editErrorsOf,
  firstEditField,
  type EditErrors,
  type EditField,
  type ProductEditDraft,
} from './product-edit-draft'

type DraftChange = Partial<Omit<ProductEditDraft, 'productId'>>

interface EditSetup {
  foodTypes: readonly FoodTypeChoice[]
  onInvalid: (field: EditField) => void
}

/**
 * Die Bezeichnung folgt der Art, solange sie nur deren Name war: Wer „Nudeln“ in „Reis“ ändert,
 * bekommt nicht „Nudeln“ als Bezeichnung (leer heißt: Name der Art).
 */
function followFoodType(draft: ProductEditDraft, previous: FoodTypeChoice | null): DraftChange {
  return previous !== null && draft.name.trim() === previous.name ? { name: '' } : {}
}

/** Wer ein Feld ändert, sieht dessen alte Meldung nicht mehr. Neu geprüft wird beim Speichern. */
function clearErrors(errors: EditErrors, update: DraftChange): EditErrors {
  const changed = Object.keys(update.nutrition ?? {}).concat(Object.keys(update))
  return Object.fromEntries(Object.entries(errors).filter(([field]) => !changed.includes(field)))
}

/** Prüfen auf dem Gerät, dann speichern. Fehler stehen am Feld, der Fokus springt zum ersten. */
function useSaveProductEdit(onInvalid: EditSetup['onInvalid']) {
  const router = useRouter()
  const [errors, setErrors] = useState<EditErrors>({})
  const [isSaving, startTransition] = useTransition()

  function submit(draft: ProductEditDraft) {
    const parsed = productEditFormSchema.safeParse(draft)
    if (!parsed.success) {
      const next = editErrorsOf(parsed.error)
      setErrors(next)
      const field = firstEditField(next)
      if (field !== null) onInvalid(field)
      return
    }
    setErrors({})
    startTransition(async () => {
      const result = await updateProductAction(parsed.data)
      if (result.status === 'saved') router.push(result.href)
      else setErrors({ form: result.message })
    })
  }

  return { errors, setErrors, isSaving, submit }
}

export function useProductEdit(initial: ProductEditDraft, setup: EditSetup) {
  const [draft, setDraft] = useState(initial)
  const [lastFoodTypeId, setLastFoodTypeId] = useState(initial.foodTypeId)
  const saving = useSaveProductEdit(setup.onInvalid)

  function change(update: DraftChange): ProductEditDraft {
    const next = { ...draft, ...update }
    setDraft(next)
    saving.setErrors((previous) => clearErrors(previous, update))
    return next
  }

  function selectFoodType(foodTypeId: string | null) {
    // „Ändern“ leert erst die Wahl, die zuletzt gewählte Art zählt für die Bezeichnung
    if (foodTypeId === null) {
      change({ foodTypeId })
      return
    }
    const previous = setup.foodTypes.find((choice) => choice.id === lastFoodTypeId) ?? null
    setLastFoodTypeId(foodTypeId)
    change({ foodTypeId, ...followFoodType(draft, previous) })
  }

  return {
    draft,
    errors: saving.errors,
    isSaving: saving.isSaving,
    change,
    selectFoodType,
    submit: () => {
      saving.submit(draft)
    },
  }
}
