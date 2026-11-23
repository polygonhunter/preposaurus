'use client'
import { useActionState } from 'react'
import { useFocusFirstInvalid } from '@/shared/hooks/use-focus-first-invalid'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { entryFormIdle } from '../actions/entry-form-state'
import { saveFoodTypeAction, type FoodTypeFormState } from '../actions/save-food-type-action'
import { CategoryPicker, type CategoryChoice } from './CategoryPicker'

type FoodTypeFormValues = Readonly<{
  name: string
  categoryId: string
  searchTerms: string
  kcalPer100: string
}>

type FoodTypeFormProps = Readonly<{
  categories: readonly CategoryChoice[]
  initialValues: FoodTypeFormValues
  /** Beim Ändern: die ID der eigenen Art */
  foodTypeId?: string
}>

const INITIAL_STATE: FoodTypeFormState = entryFormIdle()

// Eigene Lebensmittelart anlegen oder ändern (#126): Name und Kategorie sind Pflicht, Suchwörter und
// ein kcal-Richtwert freiwillig. Der Richtwert gilt nur, wenn ein Produkt keine eigenen Nährwerte
// hat, und steht dann als „ca.“ da.
export function FoodTypeForm({ categories, initialValues, foodTypeId }: FoodTypeFormProps) {
  const [state, formAction, isPending] = useActionState(saveFoodTypeAction, INITIAL_STATE)
  const formRef = useFocusFirstInvalid(state)
  const values = state.values ?? initialValues
  const { errors } = state
  return (
    <form ref={formRef} action={formAction} className="mx-4 flex flex-col gap-4 breit:mx-6">
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
      <Field
        label="kcal je 100 g oder ml (freiwillig)"
        name="kcal"
        inputMode="decimal"
        defaultValue={values.kcalPer100}
        hint="Richtwert für Produkte ohne eigene Nährwerte, steht dann als „ca.“ da."
        error={errors.kcalPer100}
      />
      <LiveMessage
        message={errors.name ?? errors.categoryId ?? errors.searchTerms ?? errors.kcalPer100}
      />
      <div className="flex items-center justify-between gap-3">
        <SaveStatus state={state} />
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          {foodTypeId === undefined ? 'Anlegen' : 'Speichern'}
        </Button>
      </div>
    </form>
  )
}
