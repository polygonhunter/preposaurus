'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Field } from '@/shared/ui/Field'
import { entryFormIdle } from '../actions/entry-form-state'
import { saveFoodTypeAction, type FoodTypeFormState } from '../actions/save-food-type-action'
import { CategoryPicker, type CategoryChoice } from '@/shared/ui/CategoryPicker'
import type { FoodTypeFormValues } from './food-type-form-values'
import { FoodTypeReferenceFields } from './FoodTypeReferenceFields'

type FoodTypeFormProps = Readonly<{
  categories: readonly CategoryChoice[]
  initialValues: FoodTypeFormValues
  /** Beim Ändern: die ID der eigenen Art */
  foodTypeId?: string
}>

const INITIAL_STATE: FoodTypeFormState = entryFormIdle()

// Eigene Lebensmittelart anlegen oder ändern (#126, #243): Name und Kategorie sind Pflicht,
// Suchwörter und Richtwerte (kcal, Makros, übliche Haltbarkeit) freiwillig.
export function FoodTypeForm({ categories, initialValues, foodTypeId }: FoodTypeFormProps) {
  const [state, formAction, isPending] = useActionState(saveFoodTypeAction, INITIAL_STATE)
  const values = state.values ?? initialValues
  const { errors } = state
  return (
    <ActionForm
      result={state}
      announcement={Object.values(errors)[0]}
      action={formAction}
      submit={{
        label: foodTypeId === undefined ? 'Anlegen' : 'Speichern',
        isPending,
        status: state,
      }}
      className="mx-4 flex flex-col gap-4 breit:mx-6"
    >
      <input type="hidden" name="id" value={foodTypeId ?? ''} />
      <Field
        label="Name der Lebensmittelart"
        name="name"
        required
        maxLength={40}
        autoComplete="off"
        defaultValue={values.name}
        error={errors.name}
      />
      <CategoryPicker
        name="kategorie"
        categories={categories}
        defaultId={values.categoryId}
        error={errors.categoryId}
      />
      <Field
        label="Suchwörter (freiwillig)"
        name="suchwoerter"
        autoComplete="off"
        defaultValue={values.searchTerms}
        hint="Andere Namen, unter denen ihr sie beim Erfassen findet, durch Komma getrennt."
        error={errors.searchTerms}
      />
      <FoodTypeReferenceFields values={values} errors={errors} />
    </ActionForm>
  )
}
